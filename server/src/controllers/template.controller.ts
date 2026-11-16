import * as templateService from "../services/template.service";
import type { Request, Response } from "express";

export const list = async (_req: Request, res: Response) => {
  res.json(await templateService.listTemplates());
};
