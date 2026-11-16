import { authOf } from "../middleware/auth";
import { validated } from "../middleware/validate";
import {
  addMemberSchema,
  createLinkSchema,
  listAccessSchema,
  removeMemberSchema,
  revokeLinkSchema,
} from "../schemas/share.schema";
import * as shareService from "../services/share.service";
import type { Request, Response } from "express";

export const addMember = async (req: Request, res: Response) => {
  const { params, body } = validated(req, addMemberSchema);
  res.status(201).json(await shareService.addMember(params.id, authOf(req).userId, body));
};

export const removeMember = async (req: Request, res: Response) => {
  const { params } = validated(req, removeMemberSchema);
  await shareService.removeMember(params.id, params.memberId, authOf(req).userId);
  res.json({ success: true });
};

export const listAccess = async (req: Request, res: Response) => {
  const { params } = validated(req, listAccessSchema);
  res.json(await shareService.listAccess(params.id, authOf(req).userId));
};

export const createLink = async (req: Request, res: Response) => {
  const { params, body } = validated(req, createLinkSchema);
  res.status(201).json(await shareService.createLink(params.id, authOf(req).userId, body));
};

export const revokeLink = async (req: Request, res: Response) => {
  const { params } = validated(req, revokeLinkSchema);
  await shareService.revokeLink(params.id, params.linkId, authOf(req).userId);
  res.json({ success: true });
};
