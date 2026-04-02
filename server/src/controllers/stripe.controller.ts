import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import * as stripeService from "../services/stripe.service";
import { logger } from "../logger";

export const createCheckout = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const { priceId } = req.body;

  if (!priceId || typeof priceId !== "string") {
    res.status(400).json({ error: "priceId is required" });
    return;
  }

  const origin = req.headers.origin || "http://localhost:3000";
  const session = await stripeService.createCheckoutSession(
    userId,
    priceId,
    `${origin}/dashboard?checkout=success`,
    `${origin}/dashboard?checkout=cancelled`,
  );

  res.json({ url: session.url });
};

export const createPortal = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const origin = req.headers.origin || "http://localhost:3000";

  const session = await stripeService.createPortalSession(userId, `${origin}/dashboard`);
  res.json({ url: session.url });
};

export const webhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string | undefined;

  if (!signature) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  try {
    const event = stripeService.constructWebhookEvent(req.body as Buffer, signature);
    await stripeService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (err) {
    logger.error("Webhook signature verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(400).json({ error: "Webhook signature verification failed" });
  }
};

export const getPlan = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const plan = await stripeService.getUserPlan(userId);
  res.json(plan);
};
