import crypto from "crypto";
import { prisma } from "../lib/db";
import { findDesignByLinkCode } from "../lib/design-access";
import { sendShareInviteEmail } from "./email.service";

type SharePermission = "readonly" | "readwrite";

const ownedDesign = (designId: string, ownerUserId: string) =>
  prisma.design.findFirst({ where: { id: designId, userId: ownerUserId } });

export const addMember = async (
  designId: string,
  ownerUserId: string,
  email: string,
  permission: SharePermission,
) => {
  const design = await prisma.design.findFirst({
    where: { id: designId, userId: ownerUserId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!design) return { error: "Design not found or not owned by you" };
  if (design.user.email === email) return { error: "Cannot share with yourself" };

  const member = await prisma.designMember.upsert({
    where: { designId_email: { designId, email } },
    update: { permission },
    create: { designId, email, permission },
  });

  await sendShareInviteEmail(
    email,
    design.name,
    design.user.name ?? design.user.email ?? "Someone",
    permission,
    designId,
  );

  return { member };
};

export const removeMember = async (designId: string, memberId: string, ownerUserId: string) => {
  if (!(await ownedDesign(designId, ownerUserId))) return false;
  const { count } = await prisma.designMember.deleteMany({ where: { id: memberId, designId } });
  return count > 0;
};

export const listAccess = async (designId: string, ownerUserId: string) => {
  if (!(await ownedDesign(designId, ownerUserId))) return null;

  const [members, links] = await Promise.all([
    prisma.designMember.findMany({ where: { designId }, orderBy: { createdAt: "desc" } }),
    prisma.designLink.findMany({ where: { designId }, orderBy: { createdAt: "desc" } }),
  ]);

  return { members, links };
};

export const createLink = async (
  designId: string,
  ownerUserId: string,
  permission: SharePermission,
  expiresAt?: Date,
) => {
  if (!(await ownedDesign(designId, ownerUserId))) return null;

  return prisma.designLink.create({
    data: { designId, code: crypto.randomBytes(24).toString("base64url"), permission, expiresAt },
  });
};

export const revokeLink = async (designId: string, linkId: string, ownerUserId: string) => {
  if (!(await ownedDesign(designId, ownerUserId))) return false;
  const { count } = await prisma.designLink.deleteMany({ where: { id: linkId, designId } });
  return count > 0;
};

export const getDesignByLinkCode = findDesignByLinkCode;

export const listSharedWithMe = async (email?: string) => {
  if (!email) return [];

  return prisma.designMember.findMany({
    where: { email },
    include: { design: { include: { user: { select: { name: true, email: true } } } } },
    orderBy: { createdAt: "desc" },
  });
};
