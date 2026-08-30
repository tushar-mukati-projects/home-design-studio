import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { furnitureListResponse } from "../schemas/response.schema";
import { listFurnitureSchema } from "../schemas/furniture.schema";
import * as furnitureController from "../controllers/furniture.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listFurnitureSchema),
  responds(furnitureListResponse),
  asyncHandler(furnitureController.listItems),
);

export { router as furnitureRouter };
