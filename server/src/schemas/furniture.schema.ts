import { z } from "zod";

export const listFurnitureSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});
