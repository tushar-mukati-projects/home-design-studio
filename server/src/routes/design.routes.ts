import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
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

router.get("/", requireAuth, validate(listDesignsSchema), designController.list);
router.post(
  "/",
  requireAuth,
  checkDesignLimit,
  validate(createDesignSchema),
  designController.create,
);
router.get("/:id", requireAuth, validate(getDesignSchema), designController.get);
router.patch("/:id", requireAuth, validate(updateDesignSchema), designController.update);
router.delete("/:id", requireAuth, validate(deleteDesignSchema), designController.remove);

export { router as designRouter };
