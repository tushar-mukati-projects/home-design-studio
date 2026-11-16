import { httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import type { Request, Response, NextFunction } from "express";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  max: number;
  name: string;
};

const SWEEP_INTERVAL_MS = 60_000;
const ANONYMOUS_KEY = "anonymous";

export const rateLimit = ({ windowMs, max, name }: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, SWEEP_INTERVAL_MS);
  sweep.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.auth?.userId ?? req.ip ?? ANONYMOUS_KEY;
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      logger.warn("Rate limit exceeded", { limiter: name, key, count: bucket.count });
      const error = httpError(429, "RATE_LIMITED");
      error.message = `Too many requests. Please wait ${retryAfter}s and try again.`;
      throw error;
    }

    next();
  };
};
