import type { Request, Response } from "express";
import { authOf } from "../middleware/auth";
import { validated } from "../middleware/validate";
import { designChatSchema } from "../schemas/design-chat.schema";
import { designChatStream } from "../services/design-chat.service";

export const designChat = async (req: Request, res: Response) => {
  const { body } = validated(req, designChatSchema);
  const { userId, email } = authOf(req);
  await designChatStream(body.designId, userId, email, body.messages, res);
};
