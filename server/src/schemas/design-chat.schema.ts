import { z } from "zod";

import { CHAT_MAX_MESSAGES, CHAT_MAX_TOTAL_CHARS, CHAT_MESSAGE_MAX_CHARS } from "../shared/canvas";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(CHAT_MESSAGE_MAX_CHARS),
});

export const designChatSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    messages: z
      .array(messageSchema)
      .min(1)
      .max(CHAT_MAX_MESSAGES)
      .refine(
        (messages) =>
          messages.reduce((total, message) => total + message.content.length, 0) <=
          CHAT_MAX_TOTAL_CHARS,
        `messages may hold at most ${CHAT_MAX_TOTAL_CHARS} characters in total`,
      ),
  }),
});
