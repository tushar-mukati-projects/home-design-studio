import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import * as stripeController from "../controllers/stripe.controller";

const router = Router();

router.post("/checkout", requireAuth, stripeController.createCheckout);
router.post("/portal", requireAuth, stripeController.createPortal);
router.post("/webhook", stripeController.webhook);
router.get("/plan", requireAuth, stripeController.getPlan);

export const stripeRouter = router;
