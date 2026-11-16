import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { httpError, type ErrorCode } from "./http-error";
import { logger } from "./logger";
import type { DesignPermission, SharePermission } from "../shared/canvas";

export type DesignRef = { id: string; userId: string };

export const designWhere = (
  designId: string,
  userId: string,
  email: string | undefined,
  access: SharePermission,
): Prisma.DesignWhereInput => ({
  id: designId,
  OR: [
    { userId },
    ...(email
      ? [
          {
            members: { some: { email, ...(access === "readwrite" ? { permission: access } : {}) } },
          },
        ]
      : []),
  ],
});

export const requireDesign = async <Select extends Prisma.DesignSelect>(
  where: Prisma.DesignWhereInput,
  select: Select,
  notFoundCode: ErrorCode,
) => {
  const design = await prisma.design.findFirst({ where, select });
  if (!design) {
    logger.warn("Design lookup refused", { designId: where.id, code: notFoundCode });
    throw httpError(404, notFoundCode);
  }
  return design;
};

export const requireOwnedDesign = async (
  designId: string,
  userId: string,
  status: number,
  code: ErrorCode,
) => {
  const design = await prisma.design.findFirst({
    where: { id: designId, userId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!design) {
    logger.warn("Owner-only action refused", { designId, userId, code });
    throw httpError(status, code);
  }
  return design;
};

export const getDesignPermission = async (
  design: DesignRef,
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
