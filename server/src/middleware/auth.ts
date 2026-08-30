import { firebaseAuth } from "../lib/firebase-admin";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../lib/types";

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.split("Bearer ")[1];

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(token);
  } catch (err) {
    logger.warn("Token verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const email = decoded.email?.toLowerCase() ?? null;

  const verifiedEmail = decoded.email_verified && email ? email : undefined;

  try {
    let user = await prisma.user.findUnique({ where: { authSub: decoded.uid } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          authSub: decoded.uid,
          email,
          name: decoded.name || email?.split("@")[0] || "User",
        },
      });
    }

    (req as AuthenticatedRequest).auth = {
      userId: user.id,
      authSub: decoded.uid,
      email: verifiedEmail,
    };

    next();
  } catch (err) {
    logger.error("Auth store failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(503).json({ error: "Service temporarily unavailable" });
  }
};
