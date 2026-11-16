import type { Request, Response, NextFunction } from "express";
import type { ZodSchema, ZodTypeAny, z } from "zod";

type Parsed = { schema: ZodSchema; data: unknown };

const requestParts = (req: Request) => ({ body: req.body, params: req.params, query: req.query });

export const validate = (schema: ZodSchema) => {
  const handler = (req: Request, res: Response, next: NextFunction) => {
    const parsed: Parsed = { schema, data: schema.parse(requestParts(req)) };
    res.locals.validated = parsed;
    next();
  };

  handler.schema = schema;
  return handler;
};

export const validated = <T extends ZodTypeAny>(req: Request, schema: T): z.output<T> => {
  const parsed = req.res?.locals.validated as Parsed | undefined;
  return parsed?.schema === schema ? parsed.data : schema.parse(requestParts(req));
};

export const responds = (schema: ZodSchema, status?: number) => {
  const handler = (_req: Request, _res: Response, next: NextFunction) => next();
  handler.responseSchema = schema;
  handler.responseStatus = status;
  return handler;
};

export const respondsWithEvents = (description: string) => {
  const handler = (_req: Request, _res: Response, next: NextFunction) => next();
  handler.eventStream = description;
  return handler;
};
