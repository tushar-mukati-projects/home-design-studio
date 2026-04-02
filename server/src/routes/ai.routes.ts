import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { furnishRoomSchema } from "../schemas/ai.schema";
import * as aiController from "../controllers/ai.controller";

const router = Router();

router.post("/furnish", requireAuth, validate(furnishRoomSchema), aiController.furnishRoom);

export { router as aiRouter };
