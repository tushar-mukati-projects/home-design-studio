import { firebaseAuth } from "../lib/firebase-admin";
import { prisma } from "../db";
import { logger } from "../logger";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    let user = await prisma.user.findUnique({
      where: { clerkId: decodedToken.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: decodedToken.uid,
          email: decodedToken.email || "",
          name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        },
      });
    }

    (req as AuthenticatedRequest).auth = {
      userId: user.id,
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };

    next();
  } catch (err) {
    logger.error("Auth failed", { error: err instanceof Error ? err.message : String(err) });
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    let user = await prisma.user.findUnique({
      where: { clerkId: decodedToken.uid },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: decodedToken.uid,
          email: decodedToken.email || "",
          name: decodedToken.name || decodedToken.email?.split("@")[0] || "User",
        },
      });
    }

    (req as AuthenticatedRequest).auth = {
      userId: user.id,
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch {}

  next();
};
