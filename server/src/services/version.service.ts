import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { applyToCollabDoc, readCollabCanvas } from "../collaboration/hocuspocus";
import { serializeDesign } from "../lib/serializers";
import { editableDesignWhere, readableDesignWhere } from "../lib/design-access";
import type { Canvas } from "../schemas/canvas.schema";

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

  await applyToCollabDoc(designId, { canvas: version.canvasData as Canvas });

  const updated = await prisma.design.findUnique({ where: { id: designId } });
  return updated ? serializeDesign(updated) : null;
};

export const deleteVersion = async (designId: string, versionId: string, userId: string) => {
  const design = await prisma.design.findFirst({ where: { id: designId, userId } });
  if (!design) return false;

  const { count } = await prisma.designVersion.deleteMany({ where: { id: versionId, designId } });
  return count > 0;
};
