import type { Request, Response } from "express";
import { validated } from "../middleware/validate";
import { designChatSchema } from "../schemas/design-chat.schema";
import { designChatStream } from "../services/design-chat.service";
import type { AuthenticatedRequest } from "../types";

export const designChat = async (req: Request, res: Response) => {
  const { body } = validated(req, designChatSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth;
  await designChatStream(body.designId, userId, email, body.messages, res);
};
