import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  listFurnitureSchema,
  placeFurnitureSchema,
  updatePlacementSchema,
  removePlacementSchema,
} from "../schemas/furniture.schema";
import * as furnitureController from "../controllers/furniture.controller";

const router = Router();

router.get("/", requireAuth, validate(listFurnitureSchema), furnitureController.listItems);
router.post("/place", requireAuth, validate(placeFurnitureSchema), furnitureController.place);
router.patch(
  "/place/:id",
  requireAuth,
  validate(updatePlacementSchema),
  furnitureController.updatePlacement,
);
router.delete(
  "/place/:id",
  requireAuth,
  validate(removePlacementSchema),
  furnitureController.removePlacement,
);

export { router as furnitureRouter };
