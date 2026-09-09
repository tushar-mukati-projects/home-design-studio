import Stripe from "stripe";
import type { Prisma, SubscriptionStatus } from "@prisma/client";
import { prisma } from "../lib/db";
import { config } from "../lib/config";
import { PLANS } from "../lib/constants";
import { logger } from "../lib/logger";

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

const requireStripe = () => {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
};

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  trialing: "trialing",
  past_due: "past_due",
  canceled: "canceled",
  incomplete: "incomplete",
  incomplete_expired: "incomplete",
  unpaid: "past_due",
};

export const getSubscription = (userId: string) =>
  prisma.subscription.findUnique({ where: { userId } });

const saveSubscription = (userId: string, data: Prisma.SubscriptionUncheckedUpdateInput) =>
  prisma.subscription.upsert({
    where: { userId },
    update: data,
    create: { ...(data as Prisma.SubscriptionUncheckedCreateInput), userId },
  });

const getOrCreateCustomer = async (userId: string) => {
  const existing = await getSubscription(userId);
  if (existing?.stripeCustomerId) return existing.stripeCustomerId;

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const customer = await requireStripe().customers.create({
    email: user.email ?? undefined,
    metadata: { userId },
  });

  await saveSubscription(userId, { stripeCustomerId: customer.id });
  logger.info("Stripe customer created", { customerId: customer.id, userId });
  return customer.id;
};

export const createCheckoutSession = async (
  userId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string,
) => {
  const customerId = await getOrCreateCustomer(userId);

  const session = await requireStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  logger.info("Checkout session created", { userId, priceId });
  return session;
};

export const createPortalSession = async (userId: string, returnUrl: string) => {
  const customerId = await getOrCreateCustomer(userId);
  return requireStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
};

const resolveUserId = async (
  metadataUserId: string | undefined,
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
) => {
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
    priceId === config.stripeProPriceId;

  await saveSubscription(userId, {
    plan: isPro ? "pro" : "free",
    status: STATUS_MAP[subscription.status] ?? "incomplete",
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    currentPeriodEnd: subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : null,
  });

  logger.info("Subscription applied", { userId, plan: isPro ? "pro" : "free" });
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

  let userId: string | undefined;

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      userId = session.metadata?.userId;
      if (!userId || session.payment_status !== "paid") break;

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      if (!subscriptionId) break;

      await applySubscription(userId, await requireStripe().subscriptions.retrieve(subscriptionId));
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      userId = await resolveUserId(subscription.metadata?.userId, subscription.customer);
      if (userId) await applySubscription(userId, subscription);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      userId = await resolveUserId(subscription.metadata?.userId, subscription.customer);
      if (!userId) break;

      await saveSubscription(userId, {
        plan: "free",
        status: "canceled",
        stripeSubscriptionId: null,
        stripePriceId: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
      });
      logger.info("Subscription cancelled", { userId });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      userId = await resolveUserId(undefined, invoice.customer ?? null);
      if (userId) {
        await saveSubscription(userId, { status: "past_due" });
        logger.warn("Invoice payment failed", { userId });
      }
      break;
    }
  }

  await prisma.billingEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      userId,
      payload: event.data.object as unknown as Prisma.InputJsonValue,
    },
  });
};

export const getUserPlan = async (userId: string) => {
  const [subscription, designCount] = await Promise.all([
    getSubscription(userId),
    prisma.design.count({ where: { userId } }),
  ]);

  const planKey = subscription?.plan === "pro" ? "pro" : "free";
  const planConfig = PLANS[planKey];

  return {
    plan: planKey,
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

export const constructWebhookEvent = async (payload: Buffer, signature: string) =>
  requireStripe().webhooks.constructEventAsync(payload, signature, config.stripeWebhookSecret);
