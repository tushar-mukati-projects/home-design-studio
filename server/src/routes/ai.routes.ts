import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requirePlanFeature } from "../middleware/plan-gate";
import { rateLimit } from "../middleware/rate-limit";
import { validate, respondsWithEvents } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { designChatSchema } from "../schemas/design-chat.schema";
import * as imageToDesignController from "../controllers/image-to-design.controller";
import * as designChatController from "../controllers/design-chat.controller";
import { uploadImage } from "../middleware/upload";

const AI_RATE_WINDOW_MS = 60_000;
const AI_RATE_MAX_PER_WINDOW = 10;
const HEAVY_AI_RATE_MAX_PER_WINDOW = 3;

const router = Router();

const aiLimit = rateLimit({ windowMs: AI_RATE_WINDOW_MS, max: AI_RATE_MAX_PER_WINDOW, name: "ai" });
const heavyAiLimit = rateLimit({
  windowMs: AI_RATE_WINDOW_MS,
  max: HEAVY_AI_RATE_MAX_PER_WINDOW,
  name: "ai-heavy",
});

router.post(
  "/image-to-design",
  requireAuth,
  heavyAiLimit,
  asyncHandler(requirePlanFeature("canUseAI", "PRO_REQUIRED")),
  uploadImage.single("image"),
  respondsWithEvents("Server-Sent Events: the detected floor plan as it is built."),
  asyncHandler(imageToDesignController.imageToDesign),
);
router.post(
  "/design-chat",
  requireAuth,
  aiLimit,
  asyncHandler(requirePlanFeature("canUseAI", "PRO_REQUIRED")),
  validate(designChatSchema),
  respondsWithEvents("Server-Sent Events: text, tool_call, tool_done, action, error, then [DONE]."),
  asyncHandler(designChatController.designChat),
);

export { router as aiRouter };
