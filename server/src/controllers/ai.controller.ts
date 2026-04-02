import type { Request, Response } from "express";
import { validated } from "../middleware/validate";
import { furnishRoomSchema } from "../schemas/ai.schema";
import * as aiService from "../services/ai.service";

export const furnishRoom = async (req: Request, res: Response) => {
  const { body } = validated(req, furnishRoomSchema);

  try {
    await aiService.furnishRoom(body, res);
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: "AI service error" });
    }
  }
};
