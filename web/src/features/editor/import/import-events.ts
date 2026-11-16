import { z } from "zod";
import { canvasSchema } from "@/shared/canvas";

export const importEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("status"), message: z.string() }),
  z.object({ type: z.literal("error"), message: z.string() }),
  z.object({ type: z.literal("result"), canvas: canvasSchema }),
]);
