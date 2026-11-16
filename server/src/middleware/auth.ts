import { Prisma, type User } from "@prisma/client";
import { config } from "../lib/config";
import { prisma } from "../lib/db";
import { firebaseAuth, verifiedEmailOf } from "../lib/firebase-admin";
import { errorMessage, httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import { TtlCache } from "../lib/ttl-cache";
import type { Request, Response, NextFunction } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { AuthInfo } from "../lib/types";

const IDENTITY_CACHE_TTL_MS = 5 * 60_000;
const BEARER_PREFIX = "Bearer ";
const UNIQUE_VIOLATION = "P2002";
const DEFAULT_USER_NAME = "User";

type Resolved = { state: "ok"; auth: AuthInfo } | { state: "anonymous" } | { state: "invalid" };
type Profile = { email: string | undefined; name: string | undefined };
type CachedIdentity = { auth: AuthInfo; name: string | undefined };

const identityCache = new TtlCache<string, CachedIdentity>(IDENTITY_CACHE_TTL_MS);

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  resolveAuth(req)
    .then((resolved) => {
      if (resolved.state !== "ok") throw httpError(401, "UNAUTHORIZED");
      req.auth = resolved.auth;
      next();
    })
    .catch(next);
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  resolveAuth(req)
    .then((resolved) => {
      if (resolved.state === "invalid") throw httpError(401, "UNAUTHORIZED");
      if (resolved.state === "ok") req.auth = resolved.auth;
      next();
    })
    .catch(next);
};

export const authOf = (req: Request): AuthInfo => {
  if (!req.auth) throw httpError(401, "UNAUTHORIZED");
  return req.auth;
};

const resolveAuth = async (req: Request): Promise<Resolved> => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) return { state: "anonymous" };
  if (!config.firebase) throw httpError(503, "AUTH_NOT_CONFIGURED");

  const decoded = await verifiedToken(header.slice(BEARER_PREFIX.length));
  if (!decoded) return { state: "invalid" };

  const profile: Profile = {
    email: verifiedEmailOf(decoded),
    name: typeof decoded.name === "string" ? decoded.name : undefined,
  };

  const cached = identityCache.get(decoded.uid);
  if (cached && cached.auth.email === profile.email && cached.name === profile.name) {
    return { state: "ok", auth: cached.auth };
  }

  const user = await findOrCreateUser(decoded, profile).catch((err: unknown) => {
    logger.error("Auth store failed", { error: errorMessage(err) });
    throw httpError(503, "AUTH_UNAVAILABLE");
  });

  const auth: AuthInfo = { userId: user.id, authSub: decoded.uid, email: profile.email };
  identityCache.set(decoded.uid, { auth, name: profile.name });
  return { state: "ok", auth };
};

const verifiedToken = async (token: string): Promise<DecodedIdToken | null> => {
  try {
    return await firebaseAuth.verifyIdToken(token);
  } catch (err) {
    logger.warn("Token verification failed", { error: errorMessage(err) });
    return null;
  }
};

const findOrCreateUser = async (decoded: DecodedIdToken, profile: Profile) => {
  const existing = await prisma.user.findUnique({ where: { authSub: decoded.uid } });
  if (existing) {
    await syncProfile(existing, profile);
    return existing;
  }

  const name = profile.name ?? decoded.email?.split("@")[0] ?? DEFAULT_USER_NAME;
  try {
    return await prisma.user.create({ data: { authSub: decoded.uid, email: profile.email, name } });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const raced = await prisma.user.findUnique({ where: { authSub: decoded.uid } });
    if (raced) return raced;
    logger.warn("Verified email already belongs to another account", { authSub: decoded.uid });
    return prisma.user.create({ data: { authSub: decoded.uid, email: null, name } });
  }
};

const syncProfile = async (user: User, profile: Profile) => {
  const changes = {
    ...(profile.email && profile.email !== user.email ? { email: profile.email } : {}),
    ...(profile.name && profile.name !== user.name ? { name: profile.name } : {}),
  };
  if (Object.keys(changes).length === 0) return;

  try {
    await prisma.user.updateMany({ where: { id: user.id }, data: changes });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    logger.warn("Verified email already belongs to another account", { userId: user.id });
  }
};

const isUniqueViolation = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === UNIQUE_VIOLATION;
