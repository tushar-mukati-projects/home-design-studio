import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { DEFAULT_FURNITURE_ITEMS } from "../constants";
import { serializeFurnitureItem, serializePlacement } from "../utils";
import { logger } from "../logger";

export const listFurnitureItems = async (filters: { category?: string; search?: string }) => {
  const where: Prisma.FurnitureItemWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  const items = await prisma.furnitureItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return items.map(serializeFurnitureItem);
};

export const placeFurniture = async (
  data: {
    designId: string;
    furnitureItemId: string;
    x: number;
    y: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    roomId?: string | null;
  },
  userId: string,
) => {
  const design = await prisma.design.findFirst({
    where: { id: data.designId, userId },
  });

  if (!design) return null;

  const furnitureItem = await prisma.furnitureItem.findUnique({
    where: { id: data.furnitureItemId },
  });

  if (!furnitureItem) return null;

  const placement = await prisma.placedFurniture.create({
    data: {
      designId: data.designId,
      furnitureItemId: data.furnitureItemId,
      x: data.x,
      y: data.y,
      rotation: data.rotation ?? 0,
      scaleX: data.scaleX ?? 1,
      scaleY: data.scaleY ?? 1,
      roomId: data.roomId ?? null,
    },
    include: {
      furnitureItem: true,
    },
  });

  return serializePlacement(placement);
};

export const updatePlacement = async (
  id: string,
  data: {
    x?: number;
    y?: number;
    rotation?: number;
    scaleX?: number;
    scaleY?: number;
    roomId?: string | null;
  },
  userId: string,
) => {
  const existing = await prisma.placedFurniture.findFirst({
    where: {
      id,
      design: { userId },
    },
  });

  if (!existing) return null;

  const placement = await prisma.placedFurniture.update({
    where: { id },
    data,
    include: {
      furnitureItem: true,
    },
  });

  return serializePlacement(placement);
};

export const removePlacement = async (id: string, userId: string) => {
  const existing = await prisma.placedFurniture.findFirst({
    where: {
      id,
      design: { userId },
    },
  });

  if (!existing) return false;

  await prisma.placedFurniture.delete({ where: { id } });
  return true;
};

export const seedDefaultFurniture = async () => {
  await prisma.furnitureItem.deleteMany({ where: { isDefault: true } });

  await prisma.furnitureItem.createMany({
    data: DEFAULT_FURNITURE_ITEMS.map((item) => ({
      ...item,
      isDefault: true,
    })),
  });

  logger.info(`Default furniture seeded`);
};
