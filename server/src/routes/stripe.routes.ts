import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { responds } from "../middleware/validate";
import { checkoutResponse, planResponse, webhookResponse } from "../schemas/response.schema";
import { asyncHandler } from "../middleware/async-handler";
import * as stripeController from "../controllers/stripe.controller";

const router = Router();

router.post(
  "/checkout",
  requireAuth,
  responds(checkoutResponse),
  asyncHandler(stripeController.createCheckout),
);
router.post(
  "/portal",
  requireAuth,
  responds(checkoutResponse),
  asyncHandler(stripeController.createPortal),
);
router.post("/webhook", responds(webhookResponse), asyncHandler(stripeController.webhook));
router.get("/plan", requireAuth, responds(planResponse), asyncHandler(stripeController.getPlan));

export const stripeRouter = router;
