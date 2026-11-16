import { httpError, type ErrorCode } from "../lib/http-error";
import { logger } from "../lib/logger";
import { planOf } from "../lib/plan";
import { PLANS } from "../shared/canvas";
import { authOf } from "./auth";
import type { Request, Response, NextFunction } from "express";

type PlanFeature = "canShare" | "canUseAI";

export const requirePlanFeature =
  (feature: PlanFeature, code: ErrorCode) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const { userId } = authOf(req);
    if (!PLANS[await planOf(userId)][feature]) {
      logger.warn("Plan feature refused", { userId, feature, designId: req.params.id });
      throw httpError(403, code);
    }
    next();
  };
