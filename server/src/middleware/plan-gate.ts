import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import { prisma } from "../lib/db";
import { getSubscription } from "../services/stripe.service";
import { PLANS } from "../lib/constants";

export const requirePro = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const subscription = await getSubscription(userId);

  if (subscription?.plan !== "pro") {
    res.status(403).json({ error: "Pro plan required" });
    return;
  }

  next();
};

export const checkDesignLimit = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const subscription = await getSubscription(userId);
  const planConfig = PLANS[subscription?.plan ?? "free"] ?? PLANS.free;

  if (planConfig.designLimit !== Infinity) {
    const count = await prisma.$transaction((tx) => tx.design.count({ where: { userId } }), {
      isolationLevel: "Serializable",
    });
    if (count >= planConfig.designLimit) {
      res.status(403).json({ error: "Design limit reached", limit: planConfig.designLimit });
      return;
    }
  }

  next();
};
