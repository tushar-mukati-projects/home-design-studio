import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { closeMemberConnections } from "../collaboration/hocuspocus";
import { prisma } from "../lib/db";
import { requireOwnedDesign } from "../lib/design-access";
import { httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import { sendShareInviteEmail } from "./email.service";
import type { AddMemberBody, CreateLinkBody } from "../schemas/share.schema";

const LINK_CODE_BYTES = 24;
const FALLBACK_INVITER_NAME = "Someone";
const RECORD_NOT_FOUND = "P2025";

export const addMember = async (designId: string, ownerUserId: string, body: AddMemberBody) => {
  const [design, previous] = await Promise.all([
    requireOwnedDesign(designId, ownerUserId, 400, "DESIGN_NOT_OWNED"),
    prisma.designMember.findUnique({
      where: { designId_email: { designId, email: body.email } },
      select: { permission: true },
    }),
  ]);
  if (design.user.email === body.email) throw httpError(400, "SHARE_SELF");

  const member = await prisma.designMember.upsert({
    where: { designId_email: { designId, email: body.email } },
    update: { permission: body.permission },
    create: { designId, email: body.email, permission: body.permission },
  });

  if (previous && previous.permission !== member.permission) {
    closeMemberConnections(designId, member.email);
  }
  if (!previous) {
    void sendShareInviteEmail({
      to: body.email,
      designName: design.name,
      inviterName: design.user.name ?? design.user.email ?? FALLBACK_INVITER_NAME,
      permission: body.permission,
      designId,
    });
  }

  return member;
};

export const removeMember = async (designId: string, memberId: string, ownerUserId: string) => {
  const removed = await prisma.designMember
    .delete({
      where: { id: memberId, designId, design: { userId: ownerUserId } },
      select: { email: true },
    })
    .catch((error: unknown) => {
      const missing =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === RECORD_NOT_FOUND;
      if (!missing) throw error;
      return null;
    });
  if (!removed) {
    logger.warn("Member removal refused", { designId, memberId, userId: ownerUserId });
    throw httpError(404, "NOT_FOUND");
  }
  closeMemberConnections(designId, removed.email);
};

export const listAccess = async (designId: string, ownerUserId: string) => {
  await requireOwnedDesign(designId, ownerUserId, 404, "NOT_FOUND");

  const [members, links] = await Promise.all([
    prisma.designMember.findMany({ where: { designId }, orderBy: { createdAt: "desc" } }),
    prisma.designLink.findMany({ where: { designId }, orderBy: { createdAt: "desc" } }),
  ]);

  return { members, links };
};

export const createLink = async (designId: string, ownerUserId: string, body: CreateLinkBody) => {
  await requireOwnedDesign(designId, ownerUserId, 404, "NOT_FOUND");

  return prisma.designLink.create({
    data: {
      designId,
      code: crypto.randomBytes(LINK_CODE_BYTES).toString("base64url"),
      permission: body.permission,
      expiresAt: body.expiresAt,
    },
  });
};

export const revokeLink = async (designId: string, linkId: string, ownerUserId: string) => {
  const { count } = await prisma.designLink.deleteMany({
    where: { id: linkId, designId, design: { userId: ownerUserId } },
  });
  if (count === 0) {
    logger.warn("Link revoke refused", { designId, linkId, userId: ownerUserId });
    throw httpError(404, "NOT_FOUND");
  }
};
