import { z } from "zod";
import { canvasSchema } from "./canvas.schema";

export const createDesignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    templateId: z.string().uuid().optional(),
  }),
});

export const updateDesignSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).nullable().optional(),
    thumbnail: z.string().nullable().optional(),
    canvasData: canvasSchema.optional(),
  }),
});

export const getDesignSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    code: z.string().min(1).optional(),
  }),
});

export const listDesignsSchema = z.object({
  query: z.object({
    scope: z.enum(["owned", "shared", "all"]).optional(),
    search: z.string().optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "name"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    offset: z.string().regex(/^\d+$/).optional(),
  }),
});

export const deleteDesignSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
