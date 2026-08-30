import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requirePro } from "../middleware/plan-gate";
import { rateLimit } from "../middleware/rate-limit";
import { validate, respondsWithEvents } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { furnishRoomSchema } from "../schemas/ai.schema";
import { designChatSchema } from "../schemas/design-chat.schema";
import * as aiController from "../controllers/ai.controller";
import * as imageToDesignController from "../controllers/image-to-design.controller";
import * as designChatController from "../controllers/design-chat.controller";
import { uploadImage } from "../middleware/upload";

const router = Router();

// Each call can run many model steps, so cap them per user.
const aiLimit = rateLimit({ windowMs: 60_000, max: 10, name: "ai" });
const heavyAiLimit = rateLimit({ windowMs: 60_000, max: 3, name: "ai-heavy" });

router.post(
  "/furnish",
  requireAuth,
  aiLimit,
  asyncHandler(requirePro),
  validate(furnishRoomSchema),
  respondsWithEvents("Server-Sent Events: furniture placements as they are chosen."),
  asyncHandler(aiController.furnishRoom),
);
router.post(
  "/image-to-design",
  requireAuth,
  heavyAiLimit,
  asyncHandler(requirePro),
  uploadImage.single("image"),
  respondsWithEvents("Server-Sent Events: the detected floor plan as it is built."),
  asyncHandler(imageToDesignController.imageToDesign),
);
router.post(
  "/design-chat",
  requireAuth,
  aiLimit,
  asyncHandler(requirePro),
  validate(designChatSchema),
  respondsWithEvents("Server-Sent Events: text, tool_call, tool_done, action, error, then [DONE]."),
  asyncHandler(designChatController.designChat),
);

export { router as aiRouter };
