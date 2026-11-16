import { authOf } from "../middleware/auth";
import { validated } from "../middleware/validate";
import {
  createDesignSchema,
  getDesignSchema,
  listDesignsSchema,
  updateDesignSchema,
  deleteDesignSchema,
} from "../schemas/design.schema";
import * as designService from "../services/design.service";
import type { Request, Response } from "express";

export const create = async (req: Request, res: Response) => {
  const { body } = validated(req, createDesignSchema);
  const { userId, email } = authOf(req);
  res.status(201).json(await designService.createDesign(body, userId, email));
};

export const get = async (req: Request, res: Response) => {
  const { params, query } = validated(req, getDesignSchema);
  res.json(
    await designService.getDesignById(params.id, {
      userId: req.auth?.userId,
      email: req.auth?.email,
      code: query.code,
    }),
  );
};

export const list = async (req: Request, res: Response) => {
  const { query } = validated(req, listDesignsSchema);
  const { userId, email } = authOf(req);
  res.json(await designService.listDesigns(userId, email, query));
};

export const update = async (req: Request, res: Response) => {
  const { params, body } = validated(req, updateDesignSchema);
  const { userId, email } = authOf(req);
  res.json(await designService.updateDesign(params.id, body, userId, email));
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteDesignSchema);
  await designService.deleteDesign(params.id, authOf(req).userId);
  res.json({ success: true });
};
