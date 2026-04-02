import Stripe from "stripe";
import { prisma } from "../db";
import { config } from "../config";
import { PLANS } from "../constants";
import { logger } from "../logger";

const stripe = config.stripeSecretKey ? new Stripe(config.stripeSecretKey) : null;

const requireStripe = () => {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
};

export const getOrCreateCustomer = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await requireStripe().customers.create({
    email: user.email,
    metadata: { userId: user.id },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

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
    subscription_data: {
      metadata: { userId },
    },
  });

  logger.info("Checkout session created", { userId, priceId });
  return session;
};

export const createPortalSession = async (userId: string, returnUrl: string) => {
  const customerId = await getOrCreateCustomer(userId);

  const session = await requireStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
};

export const handleWebhookEvent = async (event: Stripe.Event) => {
  logger.info("Processing webhook event", { type: event.type, id: event.id });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) {
        logger.warn("checkout.session.completed: missing userId in metadata", {
          sessionId: session.id,
        });
        break;
      }

      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (subscriptionId) {
        const subscription = await requireStripe().subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0]?.price?.id ?? null;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "pro",
            stripeSubId: subscriptionId,
            stripePriceId: priceId,
          },
        });

        logger.info("Plan upgraded to pro via checkout", { userId, subscriptionId });
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;

      // Try metadata first (set via subscription_data.metadata), then fall back to customer lookup
      let userId = subscription.metadata?.userId;
      if (!userId) {
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (!user) {
          logger.warn("subscription.updated: user not found", { customerId });
          break;
        }
        userId = user.id;
      }

      const isActive = subscription.status === "active" || subscription.status === "trialing";
      const priceId = subscription.items.data[0]?.price?.id ?? null;

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: isActive ? "pro" : "free",
          stripeSubId: subscription.id,
          stripePriceId: priceId,
        },
      });

      logger.info("Subscription updated", {
        userId,
        status: subscription.status,
        plan: isActive ? "pro" : "free",
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;

      let userId = subscription.metadata?.userId;
      if (!userId) {
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (!user) {
          logger.warn("subscription.deleted: user not found", { customerId });
          break;
        }
        userId = user.id;
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "free",
          stripeSubId: null,
          stripePriceId: null,
        },
      });

      logger.info("Subscription deleted, reverted to free", { userId });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id;

      if (!subId) break;

      const subscription = await requireStripe().subscriptions.retrieve(subId);
      let userId = subscription.metadata?.userId;

      if (!userId) {
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const user = await prisma.user.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (!user) break;
        userId = user.id;
      }

      logger.warn("Invoice payment failed", { userId, subscriptionId: subId });
      break;
    }
  }
};

export const getUserPlan = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const planKey = user.plan === "pro" ? "pro" : "free";
  const planConfig = PLANS[planKey];

  return {
    plan: planKey,
    canCreateDesign: true,
    canShare: planConfig.canShare,
    canUseAI: planConfig.canUseAI,
    designLimit: planConfig.designLimit,
  };
};

export const constructWebhookEvent = async (payload: Buffer, signature: string) => {
  return requireStripe().webhooks.constructEventAsync(
    payload,
    signature,
    config.stripeWebhookSecret,
  );
};
