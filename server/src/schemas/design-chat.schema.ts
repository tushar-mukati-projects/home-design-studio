import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const designChatSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    messages: z.array(messageSchema).min(1),
    canvasState: z
      .object({
        walls: z.array(z.any()).optional(),
        rooms: z.array(z.any()).optional(),
        furniture: z.array(z.any()).optional(),
        doors: z.array(z.any()).optional(),
        windows: z.array(z.any()).optional(),
        gridSize: z.number().optional(),
        zoom: z.number().optional(),
        panX: z.number().optional(),
        panY: z.number().optional(),
      })
      .optional(),
  }),
});
