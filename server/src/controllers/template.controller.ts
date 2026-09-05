import type { Request, Response } from "express";
import * as templateService from "../services/template.service";

export const list = async (_req: Request, res: Response) => {
  const templates = await templateService.listTemplates();
  res.json(templates);
};
