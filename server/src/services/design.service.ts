import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { serializeDesign, serializeDesignSummary } from "../lib/serializers";
import { applyToCollabDoc } from "../collaboration/hocuspocus";
import { findEditableDesign, getDesignPermission } from "../lib/design-access";

export const createDesign = async (
  data: {
    name: string;
    description?: string;
    width?: number;
    height?: number;
  },
  userId: string,
) => {
  const design = await prisma.design.create({
    data: {
      name: data.name,
      description: data.description,
      width: data.width ?? 800,
      height: data.height ?? 600,
      userId,
    },
  });

  return serializeDesign(design);
};

export const getDesignById = async (id: string, userId: string, email?: string) => {
  const design = await prisma.design.findUnique({
    where: { id },
  });

  if (!design) return null;

  const permission = await getDesignPermission(design, userId, email);
  if (!permission) return null;

  return { ...serializeDesign(design), permission };
};

export const listDesigns = async (
  userId: string,
  filters: {
    search?: string;
    sortBy?: string;
    order?: string;
    limit?: string;
    offset?: string;
  },
) => {
  const where: Prisma.DesignWhereInput = { userId };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const sortBy = filters.sortBy || "updatedAt";
  const order = filters.order || "desc";
  const limit = Math.min(filters.limit ? parseInt(filters.limit, 10) : 50, 100);
  const offset = filters.offset ? parseInt(filters.offset, 10) : 0;

  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where,
      orderBy: { [sortBy]: order },
      take: limit,
      skip: offset,
    }),
    prisma.design.count({ where }),
  ]);

  return {
    designs: designs.map(serializeDesignSummary),
    total,
    limit,
    offset,
  };
};

export const updateDesign = async (
  id: string,
  data: {
    name?: string;
    description?: string | null;
    thumbnail?: string | null;
    canvasData?: Record<string, unknown>;
    width?: number;
    height?: number;
  },
  userId: string,
  email?: string,
) => {
  const existing = await findEditableDesign(id, userId, email);
  if (!existing) return null;

  const updateData: Prisma.DesignUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
  if (data.width !== undefined) updateData.width = data.width;
  if (data.height !== undefined) updateData.height = data.height;

  await prisma.design.update({ where: { id }, data: updateData });

  if (data.canvasData !== undefined || data.name !== undefined) {
    await applyToCollabDoc(id, { canvas: data.canvasData, name: data.name });
  }

  const fresh = await prisma.design.findUnique({ where: { id } });
  return fresh ? serializeDesign(fresh) : null;
};

export const deleteDesign = async (id: string, userId: string) => {
  const existing = await prisma.design.findFirst({
    where: { id, userId },
  });

  if (!existing) return false;

  await prisma.design.delete({ where: { id } });
  return true;
};
