import { z } from "zod";
import { canvasSchema, designNameSchema } from "../shared/canvas";

export const SEARCH_MAX_CHARS = 200;
const DESCRIPTION_MAX_CHARS = 2_000;
const THUMBNAIL_MAX_CHARS = 2_000_000;
const LINK_CODE_MAX_CHARS = 64;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export const designIdParams = z.object({ id: z.string().uuid() });

export const createDesignSchema = z.object({
  body: z.object({
    name: designNameSchema,
    description: z.string().max(DESCRIPTION_MAX_CHARS).optional(),
    templateId: z.string().uuid().optional(),
    duplicateOf: z.string().uuid().optional(),
  }),
});

export const updateDesignSchema = z.object({
  params: designIdParams,
  body: z.object({
    name: designNameSchema.optional(),
    description: z.string().max(DESCRIPTION_MAX_CHARS).nullable().optional(),
    thumbnail: z.string().max(THUMBNAIL_MAX_CHARS).nullable().optional(),
    canvasData: canvasSchema.optional(),
  }),
});

export const getDesignSchema = z.object({
  params: designIdParams,
  query: z.object({
    code: z.string().min(1).max(LINK_CODE_MAX_CHARS).optional(),
  }),
});

export const listDesignsSchema = z.object({
  query: z.object({
    scope: z.enum(["owned", "shared", "all"]).default("owned"),
    search: z.string().max(SEARCH_MAX_CHARS).optional(),
    sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("updatedAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
    limit: z.coerce.number().int().min(0).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

export const deleteDesignSchema = z.object({ params: designIdParams });

export type CreateDesignBody = z.infer<typeof createDesignSchema>["body"];
export type UpdateDesignBody = z.infer<typeof updateDesignSchema>["body"];
export type ListDesignsQuery = z.infer<typeof listDesignsSchema>["query"];
