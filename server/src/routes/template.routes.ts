import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { checkDesignLimit } from "../middleware/plan-gate";
import { validate, responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { templateListResponse, designResponse } from "../schemas/response.schema";
import { createFromTemplateSchema } from "../schemas/template.schema";
import * as templateController from "../controllers/template.controller";

const router = Router();

router.get("/", responds(templateListResponse), asyncHandler(templateController.list));
router.post(
  "/:id/use",
  requireAuth,
  asyncHandler(checkDesignLimit),
  validate(createFromTemplateSchema),
  responds(designResponse),
  asyncHandler(templateController.createFromTemplate),
);

export { router as templateRouter };
