import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import { validated } from "../middleware/validate";
import {
  createDesignSchema,
  getDesignSchema,
  listDesignsSchema,
  updateDesignSchema,
  deleteDesignSchema,
} from "../schemas/design.schema";
import * as designService from "../services/design.service";

export const create = async (req: Request, res: Response) => {
  const { body } = validated(req, createDesignSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const design = await designService.createDesign(body, userId);
  res.status(201).json(design);
};

export const get = async (req: Request, res: Response) => {
  const { params } = validated(req, getDesignSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const design = await designService.getDesignById(params.id, userId, email);

  if (!design) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(design);
};

export const list = async (req: Request, res: Response) => {
  const { query } = validated(req, listDesignsSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const result = await designService.listDesigns(userId, query);
  res.json(result);
};

export const update = async (req: Request, res: Response) => {
  const { params, body } = validated(req, updateDesignSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const design = await designService.updateDesign(params.id, body, userId, email);

  if (!design) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(design);
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteDesignSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const deleted = await designService.deleteDesign(params.id, userId);

  if (!deleted) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json({ success: true });
};
