import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import * as stripeService from "../services/stripe.service";
import { config } from "../lib/config";
import { logger } from "../lib/logger";

// There is one paid price, so the server names it. A client-supplied one could
// only ever be accepted if it already matched this.
export const createCheckout = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;

  if (!config.stripeProPriceId) {
    res.status(503).json({ error: "Billing is not configured" });
    return;
  }

  const origin = config.frontendUrl;
  const session = await stripeService.createCheckoutSession(
    userId,
    config.stripeProPriceId,
    `${origin}/dashboard?checkout=success`,
    `${origin}/dashboard?checkout=cancelled`,
  );

  res.json({ url: session.url });
};

export const createPortal = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;

  const session = await stripeService.createPortalSession(
    userId,
    `${config.frontendUrl}/dashboard`,
  );
  res.json({ url: session.url });
};

export const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string | undefined;

  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  try {
    const event = await stripeService.constructWebhookEvent(req.body as Buffer, signature);
    logger.info("Stripe webhook received", { type: event.type, id: event.id });
    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(400).json({ error: "Webhook error" });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const plan = await stripeService.getUserPlan(userId);
  res.json(plan);
};
