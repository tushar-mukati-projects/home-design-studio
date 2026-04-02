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
  });

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
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId) break;

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
      }

      logger.info("Checkout completed", { userId });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!user) break;

      const isActive = subscription.status === "active" || subscription.status === "trialing";
      const priceId = subscription.items.data[0]?.price?.id ?? null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: isActive ? "pro" : "free",
          stripeSubId: subscription.id,
          stripePriceId: priceId,
        },
      });

      logger.info("Subscription updated", {
        userId: user.id,
        status: subscription.status,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const user = await prisma.user.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "free",
          stripeSubId: null,
          stripePriceId: null,
        },
      });

      logger.info("Subscription deleted", { userId: user.id });
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

export const constructWebhookEvent = (payload: Buffer, signature: string) => {
  return requireStripe().webhooks.constructEvent(payload, signature, config.stripeWebhookSecret);
};
