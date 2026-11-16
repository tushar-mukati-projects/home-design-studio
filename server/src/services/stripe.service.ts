import Stripe from "stripe";
import { config } from "../lib/config";
import { prisma } from "../lib/db";
import { errorMessage, httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import { planOf } from "../lib/plan";
import { PLANS } from "../shared/canvas";
import type { Prisma, SubscriptionStatus } from "@prisma/client";

const STRIPE_TIMEOUT_MS = 20_000;
const STRIPE_MAX_NETWORK_RETRIES = 2;

type Billing = { stripe: Stripe; webhookSecret: string; proPriceId: string };
type SubscriptionFields = Omit<Prisma.SubscriptionUncheckedCreateInput, "userId">;
type StripeCustomer = string | Stripe.Customer | Stripe.DeletedCustomer | null;
type WebhookHandler = (event: Stripe.Event) => Promise<string | undefined>;

const STATUS_MAP = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete",
  unpaid: "past_due",
  paused: "incomplete",
} satisfies Record<Stripe.Subscription.Status, SubscriptionStatus>;

const billing: Billing | null = config.stripe
  ? {
      stripe: new Stripe(config.stripe.secretKey, {
        timeout: STRIPE_TIMEOUT_MS,
        maxNetworkRetries: STRIPE_MAX_NETWORK_RETRIES,
      }),
      webhookSecret: config.stripe.webhookSecret,
      proPriceId: config.stripe.proPriceId,
    }
  : null;

const requireBilling = (): Billing => {
  if (!billing) throw httpError(503, "BILLING_NOT_CONFIGURED");
  return billing;
};

export const createCheckoutSession = async (
  userId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const { stripe, proPriceId } = requireBilling();
  const session = await stripe.checkout.sessions.create({
    customer: await getOrCreateCustomer(userId),
    mode: "subscription",
    line_items: [{ price: proPriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  logger.info("Checkout session created", { userId, priceId: proPriceId });
  return session;
};

export const createPortalSession = async (userId: string, returnUrl: string) =>
  requireBilling().stripe.billingPortal.sessions.create({
    customer: await getOrCreateCustomer(userId),
    return_url: returnUrl,
  });

export const constructWebhookEvent = async (payload: Buffer, signature: string) => {
  const { stripe, webhookSecret } = requireBilling();
  try {
    return await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (err) {
    logger.warn("Stripe webhook signature rejected", { error: errorMessage(err) });
    throw httpError(400, "WEBHOOK_SIGNATURE_INVALID");
  }
};

export const handleWebhookEvent = async (event: Stripe.Event) => {
  const seen = await prisma.billingEvent.findUnique({
    where: { stripeEventId: event.id },
    select: { id: true },
  });
  if (seen) {
    logger.info("Duplicate Stripe event ignored", { type: event.type, id: event.id });
    return;
  }

  const handler = WEBHOOK_HANDLERS[event.type];
  const userId = handler ? await handler(event) : undefined;

  await prisma.billingEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      userId,
      payload: JSON.parse(JSON.stringify(event.data.object)) as Prisma.InputJsonValue,
    },
  });
};

export const getUserPlan = async (userId: string) => {
  const [subscription, designCount, plan] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    prisma.design.count({ where: { userId } }),
    planOf(userId),
  ]);
  const planConfig = PLANS[plan];

  return {
    plan,
    canCreateDesign: designCount < planConfig.designLimit,
    canShare: planConfig.canShare,
    canUseAI: planConfig.canUseAI,
    designLimit: Number.isFinite(planConfig.designLimit) ? planConfig.designLimit : null,
    designCount,
    status: subscription?.status ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
  };
};

const saveSubscription = (userId: string, data: SubscriptionFields) =>
  prisma.subscription.upsert({
    where: { userId },
    update: data,
    create: { ...data, userId },
  });

const getOrCreateCustomer = async (userId: string) => {
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const customer = await requireBilling().stripe.customers.create({
    email: user.email ?? undefined,
    metadata: { userId },
  });

  await saveSubscription(userId, { stripeCustomerId: customer.id });
  logger.info("Stripe customer created", { customerId: customer.id, userId });
  return customer.id;
};

const resolveUserId = async (metadataUserId: string | undefined, customer: StripeCustomer) => {
  if (metadataUserId) return metadataUserId;
  if (!customer) return undefined;

  const customerId = typeof customer === "string" ? customer : customer.id;
  const sub = await prisma.subscription.findUnique({ where: { stripeCustomerId: customerId } });
  return sub?.userId;
};

const applySubscription = async (userId: string, subscription: Stripe.Subscription) => {
  const priceId = subscription.items.data[0]?.price?.id ?? null;
  const isPro =
    (subscription.status === "active" || subscription.status === "trialing") &&
    priceId === requireBilling().proPriceId;

  await saveSubscription(userId, {
    plan: isPro ? "pro" : "free",
    status: STATUS_MAP[subscription.status],
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
  });

  logger.info("Subscription applied", { userId, plan: isPro ? "pro" : "free" });
};

const syncSubscription = async (userId: string, subscriptionId: string) =>
  applySubscription(userId, await requireBilling().stripe.subscriptions.retrieve(subscriptionId));

const checkoutCompleted: WebhookHandler = async (event) => {
  const session = event.data.object as Stripe.Checkout.Session;
  const userId = session.metadata?.userId;
  if (!userId || session.payment_status === "unpaid") return userId;

  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  if (subscriptionId) await syncSubscription(userId, subscriptionId);
  return userId;
};

const subscriptionUpdated: WebhookHandler = async (event) => {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = await resolveUserId(subscription.metadata?.userId, subscription.customer);
  if (!userId) return undefined;

  const stored = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeSubscriptionId: true },
  });
  if (stored?.stripeSubscriptionId && stored.stripeSubscriptionId !== subscription.id) {
    logger.info("Update for a replaced subscription ignored", { userId, eventId: event.id });
    return userId;
  }

  await syncSubscription(userId, subscription.id);
  return userId;
};

const subscriptionDeleted: WebhookHandler = async (event) => {
  const subscription = event.data.object as Stripe.Subscription;
  const userId = await resolveUserId(subscription.metadata?.userId, subscription.customer);
  if (!userId) return undefined;

  const { count } = await prisma.subscription.updateMany({
    where: { userId, stripeSubscriptionId: subscription.id },
    data: {
      plan: "free",
      status: "canceled",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
    },
  });
  logger.info(count ? "Subscription cancelled" : "Cancel for a replaced subscription ignored", {
    userId,
    eventId: event.id,
  });
  return userId;
};

const invoicePaymentFailed: WebhookHandler = async (event) => {
  const invoice = event.data.object as Stripe.Invoice;
  const userId = await resolveUserId(undefined, invoice.customer ?? null);
  if (userId) {
    await saveSubscription(userId, { status: "past_due" });
    logger.warn("Invoice payment failed", { userId });
  }
  return userId;
};

const WEBHOOK_HANDLERS: Partial<Record<Stripe.Event.Type, WebhookHandler>> = {
  "checkout.session.completed": checkoutCompleted,
  "customer.subscription.updated": subscriptionUpdated,
  "customer.subscription.deleted": subscriptionDeleted,
  "invoice.payment_failed": invoicePaymentFailed,
};
