import { MulterError } from "multer";
import { ZodError } from "zod";
import { ERROR_CODES, isHttpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import type { Request, Response, NextFunction } from "express";

const BODY_PARSER_ERRORS = {
  "entity.parse.failed": { status: 400, code: "MALFORMED_BODY" },
  "entity.too.large": { status: 413, code: "BODY_TOO_LARGE" },
} as const;

type BodyParserErrorType = keyof typeof BODY_PARSER_ERRORS;

const bodyParserErrorType = (err: Error): BodyParserErrorType | undefined =>
  "type" in err && typeof err.type === "string" && err.type in BODY_PARSER_ERRORS
    ? (err.type as BodyParserErrorType)
    : undefined;

const zodFields = (err: ZodError): Record<string, string[]> => {
  const fields: Record<string, string[]> = {};
  for (const issue of err.issues) (fields[issue.path.join(".")] ??= []).push(issue.message);
  return fields;
};

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (res.headersSent) {
    logger.error("Error after response started", { error: err.message });
    res.end();
    return;
  }

  if (err instanceof MulterError) {
    res.status(400).json({ error: err.message, code: "UPLOAD_REJECTED" });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      code: "VALIDATION_FAILED",
      fields: zodFields(err),
    });
    return;
  }

  const bodyParser = bodyParserErrorType(err);
  if (bodyParser) {
    const { status, code } = BODY_PARSER_ERRORS[bodyParser];
    res.status(status).json({ error: ERROR_CODES[code], code });
    return;
  }

  if (isHttpError(err)) {
    res.status(err.status).json({ error: err.message, code: err.code, ...err.details });
    return;
  }

  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ error: ERROR_CODES.INTERNAL, code: "INTERNAL" });
};
