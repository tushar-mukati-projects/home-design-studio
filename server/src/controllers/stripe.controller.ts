import { config } from "../lib/config";
import { httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import { authOf } from "../middleware/auth";
import * as stripeService from "../services/stripe.service";
import type { Request, Response } from "express";

const CHECKOUT_SUCCESS_PATH = "/dashboard?checkout=success";
const CHECKOUT_CANCELLED_PATH = "/dashboard?checkout=cancelled";
const PORTAL_RETURN_PATH = "/dashboard";
const SIGNATURE_HEADER = "stripe-signature";

export const createCheckout = async (req: Request, res: Response) => {
  const session = await stripeService.createCheckoutSession(
    authOf(req).userId,
    `${config.frontendUrl}${CHECKOUT_SUCCESS_PATH}`,
    `${config.frontendUrl}${CHECKOUT_CANCELLED_PATH}`,
  );
  res.json({ url: session.url });
};

export const createPortal = async (req: Request, res: Response) => {
  const session = await stripeService.createPortalSession(
    authOf(req).userId,
    `${config.frontendUrl}${PORTAL_RETURN_PATH}`,
  );
  res.json({ url: session.url });
};

export const webhook = async (req: Request, res: Response) => {
  const signature = req.header(SIGNATURE_HEADER);
  if (!signature) throw httpError(400, "WEBHOOK_SIGNATURE_MISSING");

  const event = await stripeService.constructWebhookEvent(req.body as Buffer, signature);
  logger.info("Stripe webhook received", { type: event.type, id: event.id });
  await stripeService.handleWebhookEvent(event);
  res.json({ received: true });
};

export const getPlan = async (req: Request, res: Response) => {
  res.json(await stripeService.getUserPlan(authOf(req).userId));
};
