import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import {
  designListResponse,
  designResponse,
  designWithPermissionResponse,
  successResponse,
} from "../schemas/response.schema";
import { checkDesignLimit } from "../middleware/plan-gate";
import {
  createDesignSchema,
  getDesignSchema,
  listDesignsSchema,
  updateDesignSchema,
  deleteDesignSchema,
} from "../schemas/design.schema";
import * as designController from "../controllers/design.controller";

const router = Router();

router.get(
  "/",
  requireAuth,
  validate(listDesignsSchema),
  responds(designListResponse),
  asyncHandler(designController.list),
);
router.post(
  "/",
  requireAuth,
  asyncHandler(checkDesignLimit),
  validate(createDesignSchema),
  responds(designResponse),
  asyncHandler(designController.create),
);
router.get(
  "/:id",
  requireAuth,
  validate(getDesignSchema),
  responds(designWithPermissionResponse),
  asyncHandler(designController.get),
);
router.patch(
  "/:id",
  requireAuth,
  validate(updateDesignSchema),
  responds(designResponse),
  asyncHandler(designController.update),
);
router.delete(
  "/:id",
  requireAuth,
  validate(deleteDesignSchema),
  responds(successResponse),
  asyncHandler(designController.remove),
);

export { router as designRouter };
