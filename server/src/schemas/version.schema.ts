import { z } from "zod";

const designId = z.object({ id: z.string().uuid() });
const versionId = z.object({ id: z.string().uuid(), versionId: z.string().uuid() });

export const createVersionSchema = z.object({
  params: designId,
  body: z.object({
    name: z.string().min(1).max(255).optional(),
  }),
});

export const listVersionsSchema = z.object({ params: designId });

export const restoreVersionSchema = z.object({ params: versionId });

export const deleteVersionSchema = z.object({ params: versionId });
