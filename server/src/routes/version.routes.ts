import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createVersionSchema,
  listVersionsSchema,
  restoreVersionSchema,
  deleteVersionSchema,
} from "../schemas/version.schema";
import * as versionController from "../controllers/version.controller";

const router = Router();

router.get("/:designId", requireAuth, validate(listVersionsSchema), versionController.list);
router.post("/:designId", requireAuth, validate(createVersionSchema), versionController.create);
router.post(
  "/:designId/restore/:versionId",
  requireAuth,
  validate(restoreVersionSchema),
  versionController.restore,
);
router.delete("/:versionId", requireAuth, validate(deleteVersionSchema), versionController.remove);

export { router as versionRouter };
