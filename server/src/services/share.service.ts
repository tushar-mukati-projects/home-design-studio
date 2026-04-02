import crypto from "crypto";
import { prisma } from "../db";
import { sendShareInviteEmail } from "./email.service";

type SharePermission = "readonly" | "readwrite";

export const shareDesign = async (
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

  if (design.user.email === email) {
    return { error: "Cannot share with yourself" };
  }

  const targetUser = await prisma.user.findUnique({ where: { email } });

  const share = await prisma.designShare.upsert({
    where: { designId_sharedWithEmail: { designId, sharedWithEmail: email } },
    update: { permission, sharedWithId: targetUser?.id ?? null },
    create: {
      designId,
      sharedWithEmail: email,
      sharedWithId: targetUser?.id ?? null,
      permission,
    },
  });

  await sendShareInviteEmail(
    email,
    design.name,
    design.user.name ?? design.user.email,
    permission,
    designId,
  );

  return { share };
};

export const revokeShare = async (designId: string, shareId: string, ownerUserId: string) => {
  const design = await prisma.design.findFirst({ where: { id: designId, userId: ownerUserId } });
  if (!design) return false;

  await prisma.designShare.deleteMany({ where: { id: shareId, designId } });
  return true;
};

export const listShares = async (designId: string, ownerUserId: string) => {
  const design = await prisma.design.findFirst({ where: { id: designId, userId: ownerUserId } });
  if (!design) return null;

  const shares = await prisma.designShare.findMany({
    where: { designId },
    orderBy: { createdAt: "desc" },
  });

  return {
    shares,
    shareToken: design.shareToken,
    shareLinkAccess: design.shareLinkAccess,
  };
};

export const toggleShareLink = async (
  designId: string,
  ownerUserId: string,
  enabled: boolean,
  access: SharePermission = "readonly",
) => {
  const design = await prisma.design.findFirst({ where: { id: designId, userId: ownerUserId } });
  if (!design) return null;

  if (enabled) {
    const token = design.shareToken ?? crypto.randomBytes(24).toString("base64url");
    const updated = await prisma.design.update({
      where: { id: designId },
      data: { shareToken: token, shareLinkAccess: access },
    });
    return { shareToken: updated.shareToken, shareLinkAccess: updated.shareLinkAccess };
  }

  await prisma.design.update({
    where: { id: designId },
    data: { shareToken: null, shareLinkAccess: null },
  });
  return { shareToken: null, shareLinkAccess: null };
};

export const getDesignByShareToken = async (token: string) => {
  const design = await prisma.design.findUnique({
    where: { shareToken: token },
    include: {
      rooms: true,
      furniture: { include: { furnitureItem: true } },
      user: { select: { name: true } },
    },
  });
  return design;
};

export const listSharedWithMe = async (userId: string, email: string) => {
  const shares = await prisma.designShare.findMany({
    where: {
      OR: [{ sharedWithId: userId }, { sharedWithEmail: email }],
    },
    include: {
      design: {
        include: {
          rooms: true,
          furniture: { include: { furnitureItem: true } },
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return shares;
};
