import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import * as shareService from "../services/share.service";
import { serializeDesign, serializeDesignSummary } from "../lib/serializers";
import { PLANS } from "../lib/constants";
import { getSubscription } from "../services/stripe.service";

const requireSharingPlan = async (userId: string, res: Response) => {
  const subscription = await getSubscription(userId);
  const plan = PLANS[subscription?.plan ?? "free"] ?? PLANS.free;
  if (!plan.canShare) {
    res.status(403).json({ error: "Pro plan required to share designs" });
    return false;
  }
  return true;
};

export const addMember = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const id = req.params.id as string;
  const { email, permission } = req.body;

  if (!(await requireSharingPlan(userId, res))) return;

  const result = await shareService.addMember(
    id,
    userId,
    String(email).toLowerCase().trim(),
    permission === "readwrite" ? "readwrite" : "readonly",
  );

  if ("error" in result) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.status(201).json(result.member);
};

export const removeMember = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const ok = await shareService.removeMember(
    req.params.id as string,
    req.params.memberId as string,
    userId,
  );

  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const listAccess = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const result = await shareService.listAccess(req.params.id as string, userId);

  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
};

export const createLink = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const { permission, expiresAt } = req.body;

  if (!(await requireSharingPlan(userId, res))) return;

  const link = await shareService.createLink(
    req.params.id as string,
    userId,
    permission === "readwrite" ? "readwrite" : "readonly",
    expiresAt ? new Date(expiresAt) : undefined,
  );

  if (!link) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.status(201).json(link);
};

export const revokeLink = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;
  const ok = await shareService.revokeLink(
    req.params.id as string,
    req.params.linkId as string,
    userId,
  );

  if (!ok) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ success: true });
};

export const getByCode = async (req: Request, res: Response) => {
  const result = await shareService.getDesignByLinkCode(req.params.code as string);

  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const { user, ...design } = result.design;
  res.json({
    ...serializeDesign(design),
    ownerName: user.name,
    permission: result.permission,
  });
};

export const sharedWithMe = async (req: Request, res: Response) => {
  const { email } = (req as AuthenticatedRequest).auth!;
  const members = await shareService.listSharedWithMe(email);

  res.json(
    members.map((m) => {
      const { user, ...design } = m.design;
      return {
        id: m.id,
        permission: m.permission,
        createdAt: m.createdAt,
        design: serializeDesignSummary(design),
        ownerName: user.name,
        ownerEmail: user.email,
      };
    }),
  );
};
