import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import * as shareService from "../services/share.service";
import { serializeDesign } from "../utils";
import { prisma } from "../db";
import { PLANS } from "../constants";

export const share = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const id = req.params.id as string;
  const { email, permission } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const planConfig = PLANS[user?.plan ?? "free"] ?? PLANS.free;
  if (!planConfig.canShare) {
    res.status(403).json({ error: "Pro plan required to share designs" });
    return;
  }

  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const perm = permission === "readwrite" ? "readwrite" : "readonly";
  const result = await shareService.shareDesign(id, userId, email.toLowerCase().trim(), perm);

  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json(result.share);
};

export const revoke = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const id = req.params.id as string;
  const shareId = req.params.shareId as string;

  const ok = await shareService.revokeShare(id, shareId, userId);
  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const list = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const id = req.params.id as string;

  const result = await shareService.listShares(id, userId);
  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
};

export const toggleLink = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const id = req.params.id as string;
  const { enabled, access } = req.body;

  if (enabled !== false) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const planConfig = PLANS[user?.plan ?? "free"] ?? PLANS.free;
    if (!planConfig.canShare) {
      res.status(403).json({ error: "Pro plan required to share designs" });
      return;
    }
  }

  const result = await shareService.toggleShareLink(
    id,
    userId,
    enabled !== false,
    access === "readwrite" ? "readwrite" : "readonly",
  );

  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
};

export const getByToken = async (req: Request, res: Response) => {
  const token = req.params.token as string;
  const design = await shareService.getDesignByShareToken(token);

  if (!design) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { user: _user, ...designData } = design;
  res.json({ ...serializeDesign(designData), ownerName: design.user.name });
};

export const sharedWithMe = async (req: Request, res: Response) => {
  const { userId, email } = (req as AuthenticatedRequest).auth!;
  const shares = await shareService.listSharedWithMe(userId, email ?? "");

  res.json(
    shares.map((s) => {
      const { user: _owner, ...designData } = s.design;
      return {
        id: s.id,
        permission: s.permission,
        createdAt: s.createdAt,
        design: serializeDesign(designData),
        ownerName: s.design.user.name,
        ownerEmail: s.design.user.email,
      };
    }),
  );
};
