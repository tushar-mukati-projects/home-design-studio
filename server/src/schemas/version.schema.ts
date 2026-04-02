import { z } from "zod";

export const createVersionSchema = z.object({
  params: z.object({
    designId: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
});

export const listVersionsSchema = z.object({
  params: z.object({
    designId: z.string().uuid(),
  }),
});

export const restoreVersionSchema = z.object({
  params: z.object({
    designId: z.string().uuid(),
    versionId: z.string().uuid(),
  }),
});

export const deleteVersionSchema = z.object({
  params: z.object({
    versionId: z.string().uuid(),
  }),
});
