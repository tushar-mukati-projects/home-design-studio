import { z } from "zod";
import { designNameSchema } from "../shared/canvas";
import { designIdParams } from "./design.schema";

const versionId = designIdParams.extend({ versionId: z.string().uuid() });

export const createVersionSchema = z.object({
  params: designIdParams,
  body: z.object({
    name: designNameSchema.optional(),
  }),
});

export const listVersionsSchema = z.object({ params: designIdParams });

export const restoreVersionSchema = z.object({ params: versionId });

export const deleteVersionSchema = z.object({ params: versionId });
