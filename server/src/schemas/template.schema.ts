import { z } from "zod";

export const createFromTemplateSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255),
  }),
});
