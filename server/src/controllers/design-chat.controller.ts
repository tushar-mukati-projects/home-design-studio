import type { Request, Response } from "express";
import { validated } from "../middleware/validate";
import { designChatSchema } from "../schemas/design-chat.schema";
import { designChatStream } from "../services/design-chat.service";

export const designChat = async (req: Request, res: Response) => {
  const { body } = validated(req, designChatSchema);
  const canvasState = {
    walls: body.canvasState.walls ?? [],
    rooms: body.canvasState.rooms ?? [],
    furniture: body.canvasState.furniture ?? [],
    doors: body.canvasState.doors ?? [],
    windows: body.canvasState.windows ?? [],
  };
  await designChatStream(body.messages, canvasState, res);
};
