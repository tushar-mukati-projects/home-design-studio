import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import * as userService from "../services/user.service";

export const me = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const profile = await userService.getMe(userId);

  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(profile);
};
