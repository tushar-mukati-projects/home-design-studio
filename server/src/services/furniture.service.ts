import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { FURNITURE_CATALOG } from "../lib/seed-data/furniture";
import { serializeFurnitureItem } from "../lib/serializers";

export const listFurnitureItems = async (filters: { category?: string; search?: string }) => {
  const where: Prisma.FurnitureItemWhereInput = {};
  if (filters.category) where.category = filters.category;
  if (filters.search) where.name = { contains: filters.search, mode: "insensitive" };

  const items = await prisma.furnitureItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return items.map(serializeFurnitureItem);
};

export const seedFurniture = async () => {
  for (const item of FURNITURE_CATALOG) {
    const { id, ...data } = item;
    await prisma.furnitureItem.upsert({ where: { id }, update: data, create: item });
  }
};
