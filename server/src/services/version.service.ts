import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

export const createVersion = async (designId: string, userId: string, name?: string) => {
  const design = await prisma.design.findFirst({
    where: {
      id: designId,
      OR: [{ userId }, { shares: { some: { sharedWithId: userId, permission: "readwrite" } } }],
    },
    include: {
      rooms: true,
      furniture: {
        include: { furnitureItem: true },
      },
    },
  });

  if (!design) return null;

  const version = await prisma.designVersion.create({
    data: {
      designId,
      name: name || "Auto-save",
      canvasData: design.canvasData as Prisma.InputJsonValue,
      rooms: design.rooms as unknown as Prisma.InputJsonValue,
      furniture: design.furniture as unknown as Prisma.InputJsonValue,
      createdBy: userId,
    },
  });

  return version;
};

export const listVersions = async (designId: string, userId: string) => {
  const design = await prisma.design.findFirst({
    where: {
      id: designId,
      OR: [{ userId }, { shares: { some: { sharedWithId: userId } } }],
    },
  });

  if (!design) return null;

  const versions = await prisma.designVersion.findMany({
    where: { designId },
    orderBy: { createdAt: "desc" },
  });

  return versions;
};

export const restoreVersion = async (designId: string, versionId: string, userId: string) => {
  const design = await prisma.design.findFirst({
    where: {
      id: designId,
      OR: [{ userId }, { shares: { some: { sharedWithId: userId, permission: "readwrite" } } }],
    },
  });

  if (!design) return null;

  const version = await prisma.designVersion.findFirst({
    where: { id: versionId, designId },
  });

  if (!version) return null;

  await prisma.room.deleteMany({ where: { designId } });
  await prisma.placedFurniture.deleteMany({ where: { designId } });

  const rooms = version.rooms as Array<Record<string, unknown>>;
  if (rooms.length > 0) {
    await prisma.room.createMany({
      data: rooms.map((r) => ({
        id: r.id as string,
        name: r.name as string,
        type: r.type as string,
        color: r.color as string,
        points: r.points as Prisma.InputJsonValue,
        area: r.area as number,
        designId,
      })),
    });
  }

  const furniture = version.furniture as Array<Record<string, unknown>>;
  if (furniture.length > 0) {
    await prisma.placedFurniture.createMany({
      data: furniture.map((f) => ({
        id: f.id as string,
        x: f.x as number,
        y: f.y as number,
        rotation: f.rotation as number,
        scaleX: (f.scaleX as number) ?? 1,
        scaleY: (f.scaleY as number) ?? 1,
        furnitureItemId: f.furnitureItemId as string,
        roomId: (f.roomId as string) ?? null,
        designId,
      })),
    });
  }

  const updated = await prisma.design.update({
    where: { id: designId },
    data: {
      canvasData: version.canvasData as Prisma.InputJsonValue,
      yjsState: null,
    },
    include: {
      rooms: true,
      furniture: { include: { furnitureItem: true } },
    },
  });

  return updated;
};

export const deleteVersion = async (versionId: string, userId: string) => {
  const version = await prisma.designVersion.findUnique({
    where: { id: versionId },
    include: { design: true },
  });

  if (!version) return false;

  const hasAccess = version.design.userId === userId || version.createdBy === userId;

  if (!hasAccess) return false;

  await prisma.designVersion.delete({ where: { id: versionId } });
  return true;
};
