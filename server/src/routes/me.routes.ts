import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { responds } from "../middleware/validate";
import { asyncHandler } from "../middleware/async-handler";
import { meResponse } from "../schemas/response.schema";
import * as meController from "../controllers/me.controller";

const router = Router();

router.get("/", requireAuth, responds(meResponse), asyncHandler(meController.me));

export { router as meRouter };
