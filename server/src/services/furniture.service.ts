import { prisma } from "../lib/db";
import { FURNITURE_CATALOG } from "../lib/seed-data/furniture";
import { serializeFurnitureItem } from "../lib/serializers";
import type { Prisma } from "@prisma/client";
import type { ListFurnitureQuery } from "../schemas/furniture.schema";

export const listFurnitureItems = async (query: ListFurnitureQuery) => {
  const where: Prisma.FurnitureItemWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.search) where.name = { contains: query.search, mode: "insensitive" };

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
