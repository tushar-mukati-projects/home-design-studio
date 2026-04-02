import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";
import { prisma } from "../db";
import { PLANS } from "../constants";

export const requirePro = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user || user.plan !== "pro") {
    res.status(403).json({ error: "Pro plan required" });
    return;
  }

  next();
};

export const checkDesignLimit = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const planConfig = PLANS[user.plan] ?? PLANS.free;

  if (planConfig.designLimit !== Infinity) {
    const count = await prisma.design.count({ where: { userId } });
    if (count >= planConfig.designLimit) {
      res.status(403).json({ error: "Design limit reached", limit: planConfig.designLimit });
      return;
    }
  }

  next();
};
