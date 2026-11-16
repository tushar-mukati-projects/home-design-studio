import { z } from "zod";
import { SEARCH_MAX_CHARS } from "./design.schema";

const CATEGORY_MAX_CHARS = 50;

export const listFurnitureSchema = z.object({
  query: z.object({
    category: z.string().max(CATEGORY_MAX_CHARS).optional(),
    search: z.string().max(SEARCH_MAX_CHARS).optional(),
  }),
});

export type ListFurnitureQuery = z.infer<typeof listFurnitureSchema>["query"];
