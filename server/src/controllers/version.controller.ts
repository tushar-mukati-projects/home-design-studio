import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import { validated } from "../middleware/validate";
import {
  createVersionSchema,
  listVersionsSchema,
  restoreVersionSchema,
  deleteVersionSchema,
} from "../schemas/version.schema";
import * as versionService from "../services/version.service";

export const create = async (req: Request, res: Response) => {
  const { params, body } = validated(req, createVersionSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const version = await versionService.createVersion(params.designId, userId, body.name);

  if (!version) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.status(201).json(version);
};

export const list = async (req: Request, res: Response) => {
  const { params } = validated(req, listVersionsSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const versions = await versionService.listVersions(params.designId, userId);

  if (!versions) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(versions);
};

export const restore = async (req: Request, res: Response) => {
  const { params } = validated(req, restoreVersionSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const design = await versionService.restoreVersion(params.designId, params.versionId, userId);

  if (!design) {
    res.status(404).json({ error: "Design or version not found" });
    return;
  }

  res.json(design);
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteVersionSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const deleted = await versionService.deleteVersion(params.versionId, userId);

  if (!deleted) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  res.json({ success: true });
};
