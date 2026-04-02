import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createRoomSchema,
  updateRoomSchema,
  deleteRoomSchema,
  detectRoomsSchema,
} from "../schemas/room.schema";
import * as roomController from "../controllers/room.controller";

const router = Router();

router.post("/", requireAuth, validate(createRoomSchema), roomController.create);
router.patch("/:id", requireAuth, validate(updateRoomSchema), roomController.update);
router.delete("/:id", requireAuth, validate(deleteRoomSchema), roomController.remove);
router.post("/detect", requireAuth, validate(detectRoomsSchema), roomController.detectRooms);

export { router as roomRouter };
