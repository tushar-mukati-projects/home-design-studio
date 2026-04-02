import { z } from "zod";

export const createDesignSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    isPublic: z.boolean().optional(),
  }),
});

export const updateDesignSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1).max(255).optional(),
      description: z.string().max(2000).nullable().optional(),
      thumbnail: z.string().nullable().optional(),
      canvasData: z.record(z.unknown()).optional(),
      width: z.number().positive().optional(),
      height: z.number().positive().optional(),
      isPublic: z.boolean().optional(),
    })
    .passthrough(),
});

export const getDesignSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const listDesignsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isPublic: z.enum(["true", "false"]).optional(),
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
