import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
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
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const version = await versionService.createVersion(params.id, userId, body.name, email);

  if (!version) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.status(201).json(version);
};

export const list = async (req: Request, res: Response) => {
  const { params } = validated(req, listVersionsSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const versions = await versionService.listVersions(params.id, userId, email);

  if (!versions) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(versions);
};

export const restore = async (req: Request, res: Response) => {
  const { params } = validated(req, restoreVersionSchema);
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const design = await versionService.restoreVersion(params.id, params.versionId, userId, email);

  if (!design) {
    res.status(404).json({ error: "Design or version not found" });
    return;
  }

  res.json(design);
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteVersionSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const deleted = await versionService.deleteVersion(params.id, params.versionId, userId);

  if (!deleted) {
    res.status(404).json({ error: "Version not found" });
    return;
  }

  res.json({ success: true });
};
