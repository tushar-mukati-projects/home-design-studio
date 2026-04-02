import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const designChatSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    messages: z.array(messageSchema).min(1),
  }),
});
