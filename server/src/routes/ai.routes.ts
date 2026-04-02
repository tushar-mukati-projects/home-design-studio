import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { furnishRoomSchema } from "../schemas/ai.schema";
import { designChatSchema } from "../schemas/design-chat.schema";
import * as aiController from "../controllers/ai.controller";
import * as imageToDesignController from "../controllers/image-to-design.controller";
import * as designChatController from "../controllers/design-chat.controller";
import { uploadImage } from "../middleware/upload";

const router = Router();

router.post("/furnish", requireAuth, validate(furnishRoomSchema), aiController.furnishRoom);
router.post(
  "/image-to-design",
  requireAuth,
  uploadImage.single("image"),
  imageToDesignController.imageToDesign,
);
router.post(
  "/design-chat",
  requireAuth,
  validate(designChatSchema),
  designChatController.designChat,
);

export { router as aiRouter };
