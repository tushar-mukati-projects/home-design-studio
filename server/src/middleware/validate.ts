import type { Request, Response, NextFunction } from "express";
import { type ZodSchema, ZodError } from "zod";

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
};

export const validated = <T>(req: Request, schema: ZodSchema<T>): T => {
  return schema.parse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
};
