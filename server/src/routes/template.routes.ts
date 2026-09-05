import { Router } from "express";
import { responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { templateListResponse } from "../schemas/response.schema";
import * as templateController from "../controllers/template.controller";

const router = Router();

router.get("/", responds(templateListResponse), asyncHandler(templateController.list));

export { router as templateRouter };
