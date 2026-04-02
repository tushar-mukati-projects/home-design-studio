import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { serializeDesign } from "../utils";

const designInclude = {
  rooms: true,
  furniture: {
    include: {
      furnitureItem: true,
    },
  },
} satisfies Prisma.DesignInclude;

export const createDesign = async (
  data: {
    name: string;
    description?: string;
    width?: number;
    height?: number;
    isPublic?: boolean;
  },
  userId: string,
) => {
  const design = await prisma.design.create({
    data: {
      name: data.name,
      description: data.description,
      width: data.width ?? 800,
      height: data.height ?? 600,
      isPublic: data.isPublic ?? false,
      userId,
    },
    include: designInclude,
  });
  return serializeDesign(design);
};

export const getDesignById = async (id: string, userId: string, email?: string) => {
  let design = await prisma.design.findFirst({
    where: {
      id,
      OR: [{ userId }, { isPublic: true }],
    },
    include: designInclude,
  });

  if (design) {
    const permission = design.userId === userId ? "owner" : "readonly";
    return { ...serializeDesign(design), permission };
  }

  if (userId || email) {
    const share = await prisma.designShare.findFirst({
      where: {
        designId: id,
        OR: [
          ...(userId ? [{ sharedWithId: userId }] : []),
          ...(email ? [{ sharedWithEmail: email }] : []),
        ],
      },
    });
    if (share) {
      design = await prisma.design.findUnique({
        where: { id },
        include: designInclude,
      });
      if (design) {
        return { ...serializeDesign(design), permission: share.permission };
      }
    }
  }

  return null;
};

export const listDesigns = async (
  userId: string,
  filters: {
    search?: string;
    isPublic?: string;
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

  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic === "true";
  }

  const sortBy = filters.sortBy || "updatedAt";
  const order = filters.order || "desc";
  const limit = filters.limit ? parseInt(filters.limit, 10) : 50;
  const offset = filters.offset ? parseInt(filters.offset, 10) : 0;

  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where,
      include: designInclude,
      orderBy: { [sortBy]: order },
      take: limit,
      skip: offset,
    }),
    prisma.design.count({ where }),
  ]);

  return {
    designs: designs.map(serializeDesign),
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
    isPublic?: boolean;
    rooms?: Array<{
      id: string;
      name: string;
      type: string;
      color: string;
      points: unknown;
      area: number;
    }>;
    furniture?: Array<{
      id: string;
      x: number;
      y: number;
      rotation: number;
      scaleX: number;
      scaleY: number;
      furnitureItemId: string;
      roomId?: string | null;
    }>;
  },
  userId: string,
  email?: string,
) => {
  let existing = await prisma.design.findFirst({
    where: { id, userId },
  });

  if (!existing && (userId || email)) {
    const share = await prisma.designShare.findFirst({
      where: {
        designId: id,
        permission: "readwrite",
        OR: [
          ...(userId ? [{ sharedWithId: userId }] : []),
          ...(email ? [{ sharedWithEmail: email }] : []),
        ],
      },
    });
    if (share) {
      existing = await prisma.design.findUnique({ where: { id } });
    }
  }

  if (!existing) return null;

  const updateData: Prisma.DesignUpdateInput = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnail !== undefined) updateData.thumbnail = data.thumbnail;
  if (data.canvasData !== undefined)
    updateData.canvasData = data.canvasData as Prisma.InputJsonValue;
  if (data.width !== undefined) updateData.width = data.width;
  if (data.height !== undefined) updateData.height = data.height;
  if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;

  if (data.rooms !== undefined) {
    await prisma.room.deleteMany({ where: { designId: id } });
    if (data.rooms.length > 0) {
      await prisma.room.createMany({
        data: data.rooms.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          color: r.color,
          points: r.points as Prisma.InputJsonValue,
          area: r.area,
          designId: id,
        })),
      });
    }
  }

  if (data.furniture !== undefined) {
    await prisma.placedFurniture.deleteMany({ where: { designId: id } });
    if (data.furniture.length > 0) {
      await prisma.placedFurniture.createMany({
        data: data.furniture.map((f) => ({
          id: f.id,
          x: f.x,
          y: f.y,
          rotation: f.rotation,
          scaleX: f.scaleX,
          scaleY: f.scaleY,
          furnitureItemId: f.furnitureItemId,
          roomId: f.roomId ?? null,
          designId: id,
        })),
      });
    }
  }

  const design = await prisma.design.update({
    where: { id },
    data: updateData,
    include: designInclude,
  });

  return serializeDesign(design);
};

export const deleteDesign = async (id: string, userId: string) => {
  const existing = await prisma.design.findFirst({
    where: { id, userId },
  });

  if (!existing) return false;

  await prisma.design.delete({ where: { id } });
  return true;
};
