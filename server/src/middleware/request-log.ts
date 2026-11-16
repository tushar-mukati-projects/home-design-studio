import { logger } from "../lib/logger";
import type { Request, Response, NextFunction } from "express";

export const requestLog = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";
    logger[level]("request", {
      method: req.method,
      path: req.originalUrl.split("?")[0],
      status: res.statusCode,
      ms: Date.now() - startedAt,
    });
  });
  next();
};
