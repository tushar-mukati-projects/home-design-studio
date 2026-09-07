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
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const design = await designService.createDesign(body, userId, email);

  if (!design) {
    res
      .status(404)
      .json({ error: body.duplicateOf ? "Design to copy not found" : "Template not found" });
    return;
  }

  res.status(201).json(design);
};

export const get = async (req: Request, res: Response) => {
  const { params, query } = validated(req, getDesignSchema);
  const auth = (req as AuthenticatedRequest).auth;
  const design = await designService.getDesignById(params.id, {
    userId: auth?.userId,
    email: auth?.email,
    code: query.code,
  });

  if (!design) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(design);
};

export const list = async (req: Request, res: Response) => {
  const { query } = validated(req, listDesignsSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const result = await designService.listDesigns(userId, email, query);
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
