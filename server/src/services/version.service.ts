import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { applyToCollabDoc, readCollabCanvas } from "../collaboration/hocuspocus";
import { serializeDesign } from "../lib/serializers";
import { editableDesignWhere, readableDesignWhere } from "../lib/design-access";

export const createVersion = async (
  designId: string,
  userId: string,
  name?: string,
  email?: string,
) => {
  const design = await prisma.design.findFirst({
    where: editableDesignWhere(designId, userId, email),
    select: { canvasData: true },
  });

  if (!design) return null;

  const live = await readCollabCanvas(designId);
  const canvasData = live
    ? { ...((design.canvasData ?? {}) as Record<string, unknown>), ...live }
    : (design.canvasData ?? {});

  const version = await prisma.designVersion.create({
    data: {
      designId,
      name: name || "Auto-save",
      canvasData: canvasData as Prisma.InputJsonValue,
      createdById: userId,
    },
  });

  return version;
};

export const listVersions = async (designId: string, userId: string, email?: string) => {
  const design = await prisma.design.findFirst({
    where: readableDesignWhere(designId, userId, email),
  });

  if (!design) return null;

  const versions = await prisma.designVersion.findMany({
    where: { designId },
    orderBy: { createdAt: "desc" },
  });

  return versions;
};

export const restoreVersion = async (
  designId: string,
  versionId: string,
  userId: string,
  email?: string,
) => {
  const design = await prisma.design.findFirst({
    where: editableDesignWhere(designId, userId, email),
  });

  if (!design) return null;

  const version = await prisma.designVersion.findFirst({
    where: { id: versionId, designId },
  });

  if (!version) return null;

  const canvasData = (version.canvasData ?? {}) as Record<string, unknown>;

  await applyToCollabDoc(designId, { canvas: canvasData });

  const updated = await prisma.design.findUnique({ where: { id: designId } });
  return updated ? serializeDesign(updated) : null;
};

export const deleteVersion = async (versionId: string, userId: string) => {
  const version = await prisma.designVersion.findUnique({
    where: { id: versionId },
    include: { design: true },
  });

  if (!version) return false;

  if (version.design.userId !== userId) return false;

  await prisma.designVersion.delete({ where: { id: versionId } });
  return true;
};
