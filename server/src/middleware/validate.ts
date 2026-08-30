import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  const handler = (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
        res.status(400).json({ error: message });
        return;
      }
      next(err);
    }
  };

  // The OpenAPI document reads this off the live router, so the docs are
  // generated from the same schema that validates the request.
  handler.schema = schema;
  return handler;
};

export const validated = <T>(req: Request, schema: ZodSchema<T>): T => {
  return schema.parse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
};

// Declares the success-response shape for a route. It does not run any checks;
// the OpenAPI document reads it off the router so responses are documented from
// a schema the tests also assert the serializers against.
export const responds = (schema: ZodSchema) => {
  const handler = (_req: Request, _res: Response, next: NextFunction) => next();
  handler.responseSchema = schema;
  return handler;
};

// For endpoints that stream Server-Sent Events rather than returning JSON.
export const respondsWithEvents = (description: string) => {
  const handler = (_req: Request, _res: Response, next: NextFunction) => next();
  handler.eventStream = description;
  return handler;
};
