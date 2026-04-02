import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { createFromTemplateSchema } from "../schemas/template.schema";
import * as templateController from "../controllers/template.controller";

const router = Router();

router.get("/", templateController.list);
router.post(
  "/:id/use",
  requireAuth,
  validate(createFromTemplateSchema),
  templateController.createFromTemplate,
);

export { router as templateRouter };
