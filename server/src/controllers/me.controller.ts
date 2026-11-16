import { authOf } from "../middleware/auth";
import * as userService from "../services/user.service";
import type { Request, Response } from "express";

export const me = async (req: Request, res: Response) => {
  res.json(await userService.getMe(authOf(req).userId));
};
