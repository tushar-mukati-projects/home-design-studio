import { authOf } from "../middleware/auth";
import { validated } from "../middleware/validate";
import {
  createVersionSchema,
  listVersionsSchema,
  restoreVersionSchema,
  deleteVersionSchema,
} from "../schemas/version.schema";
import * as versionService from "../services/version.service";
import type { Request, Response } from "express";

export const create = async (req: Request, res: Response) => {
  const { params, body } = validated(req, createVersionSchema);
  const { userId, email } = authOf(req);
  res.status(201).json(await versionService.createVersion(params.id, userId, body.name, email));
};

export const list = async (req: Request, res: Response) => {
  const { params } = validated(req, listVersionsSchema);
  const { userId, email } = authOf(req);
  res.json(await versionService.listVersions(params.id, userId, email));
};

export const restore = async (req: Request, res: Response) => {
  const { params } = validated(req, restoreVersionSchema);
  const { userId, email } = authOf(req);
  res.json(await versionService.restoreVersion(params.id, params.versionId, userId, email));
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteVersionSchema);
  await versionService.deleteVersion(params.id, params.versionId, authOf(req).userId);
  res.json({ success: true });
};
