import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { DEFAULT_FURNITURE_ITEMS } from "../lib/constants";
import { serializeFurnitureItem } from "../lib/serializers";

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

export const seedDefaultFurniture = async () => {
  for (const item of DEFAULT_FURNITURE_ITEMS) {
    const existing = await prisma.furnitureItem.findFirst({
      where: { name: item.name, isDefault: true },
    });

    if (existing) {
      await prisma.furnitureItem.update({
        where: { id: existing.id },
        data: { ...item, isDefault: true },
      });
    } else {
      await prisma.furnitureItem.create({
        data: { ...item, isDefault: true },
      });
    }
  }
};
