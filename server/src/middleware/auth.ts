import { firebaseAuth } from "../lib/firebase-admin";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import type { Request, Response, NextFunction } from "express";
import type { AuthInfo, AuthenticatedRequest } from "../lib/types";
import { TtlCache } from "../lib/ttl-cache";

// The user row for a uid does not change between requests, but looking it up costs a full
// database round trip on every call. Token verification itself still runs every time.
const identityCache = new TtlCache<string, AuthInfo>(5 * 60 * 1000);

type Resolved = { state: "ok"; auth: AuthInfo } | { state: "anonymous" } | { state: "invalid" };

const resolveAuth = async (req: Request): Promise<Resolved> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return { state: "anonymous" };

  let decoded;
  try {
    decoded = await firebaseAuth.verifyIdToken(authHeader.split("Bearer ")[1] as string);
  } catch (err) {
    logger.warn("Token verification failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return { state: "invalid" };
  }

  const email = decoded.email?.toLowerCase() ?? null;
  const verifiedEmail = decoded.email_verified && email ? email : undefined;

  const cached = identityCache.get(decoded.uid);
  if (cached && cached.email === verifiedEmail) return { state: "ok", auth: cached };

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

  const auth: AuthInfo = { userId: user.id, authSub: decoded.uid, email: verifiedEmail };
  identityCache.set(decoded.uid, auth);
  return { state: "ok", auth };
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  let resolved: Resolved;

  try {
    resolved = await resolveAuth(req);
  } catch (err) {
    logger.error("Auth store failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }

  if (resolved.state !== "ok") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  (req as AuthenticatedRequest).auth = resolved.auth;
  next();
};

// Anonymous is a valid caller here, since a share link proves access by its code
// alone. A token that was sent but failed still has to 401 so the client refreshes
// it instead of reading the reply as "no such design".
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  let resolved: Resolved;

  try {
    resolved = await resolveAuth(req);
  } catch (err) {
    logger.error("Auth store failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(503).json({ error: "Service temporarily unavailable" });
    return;
  }

  if (resolved.state === "invalid") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (resolved.state === "ok") (req as AuthenticatedRequest).auth = resolved.auth;
  next();
};
