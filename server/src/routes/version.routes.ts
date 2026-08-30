import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate, responds } from "../middleware/validate";
import {
  createVersionSchema,
  listVersionsSchema,
  restoreVersionSchema,
  deleteVersionSchema,
} from "../schemas/version.schema";
import { asyncHandler } from "../middleware/async-handler";
import {
  versionListResponse,
  versionResponse,
  designResponse,
  successResponse,
} from "../schemas/response.schema";
import * as versionController from "../controllers/version.controller";

const router = Router();

router.get(
  "/:designId",
  requireAuth,
  validate(listVersionsSchema),
  responds(versionListResponse),
  asyncHandler(versionController.list),
);
router.post(
  "/:designId",
  requireAuth,
  validate(createVersionSchema),
  responds(versionResponse),
  asyncHandler(versionController.create),
);
router.post(
  "/:designId/restore/:versionId",
  requireAuth,
  validate(restoreVersionSchema),
  responds(designResponse),
  asyncHandler(versionController.restore),
);
router.delete(
  "/:versionId",
  requireAuth,
  validate(deleteVersionSchema),
  responds(successResponse),
  asyncHandler(versionController.remove),
);

export { router as versionRouter };
