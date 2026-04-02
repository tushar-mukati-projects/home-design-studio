import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import { validated } from "../middleware/validate";
import { createFromTemplateSchema } from "../schemas/template.schema";
import * as templateService from "../services/template.service";

export const list = async (_req: Request, res: Response) => {
  const templates = await templateService.listTemplates();
  res.json(templates);
};

export const createFromTemplate = async (req: Request, res: Response) => {
  const { params, body } = validated(req, createFromTemplateSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const design = await templateService.createDesignFromTemplate(params.id, userId, body.name);

  if (!design) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.status(201).json(design);
};
