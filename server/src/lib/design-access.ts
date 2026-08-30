import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type DesignPermission = "owner" | "readwrite" | "readonly";

// Membership is keyed on the invited email, and the auth context only carries an
// email once the provider has verified it. An unverified address therefore
// matches nothing, which is the point: otherwise anyone could claim an address
// and inherit the designs shared with it.
const memberFilter = (email: string | undefined, permission?: "readwrite") =>
  email ? { some: { email, ...(permission ? { permission } : {}) } } : undefined;

export const editableDesignWhere = (
  designId: string,
  userId: string,
  email?: string,
): Prisma.DesignWhereInput => {
  const members = memberFilter(email, "readwrite");
  return {
    id: designId,
    OR: [{ userId }, ...(members ? [{ members }] : [])],
  };
};

export const readableDesignWhere = (
  designId: string,
  userId: string,
  email?: string,
): Prisma.DesignWhereInput => {
  const members = memberFilter(email);
  return {
    id: designId,
    OR: [{ userId }, ...(members ? [{ members }] : [])],
  };
};

export const findEditableDesign = (designId: string, userId: string, email?: string) =>
  prisma.design.findFirst({ where: editableDesignWhere(designId, userId, email) });

export const getDesignPermission = async (
  design: { id: string; userId: string },
  userId: string,
  email?: string,
): Promise<DesignPermission | null> => {
  if (design.userId === userId) return "owner";
  if (!email) return null;

  const member = await prisma.designMember.findUnique({
    where: { designId_email: { designId: design.id, email } },
    select: { permission: true },
  });

  return member?.permission ?? null;
};

// A link grants access by possession of the code, so it never involves a user.
export const findDesignByLinkCode = async (code: string) => {
  const link = await prisma.designLink.findUnique({
    where: { code },
    include: { design: { include: { user: { select: { name: true } } } } },
  });

  if (!link) return null;
  if (link.expiresAt && link.expiresAt <= new Date()) return null;

  return { design: link.design, permission: link.permission };
};
