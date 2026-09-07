import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { serializeDesign, serializeDesignSummary } from "../lib/serializers";
import { applyToCollabDoc } from "../collaboration/hocuspocus";
import {
  findDesignByLinkCode,
  findEditableDesign,
  getDesignPermission,
  readableDesignWhere,
} from "../lib/design-access";
import { createDesignFromTemplate } from "./template.service";
import { emptyCanvas, type Canvas } from "../schemas/canvas.schema";

const withOwner = (email?: string) => ({
  user: { select: { name: true, email: true } },
  members: { where: { email: email ?? "" }, select: { permission: true } },
});

export const createDesign = async (
  data: {
    name: string;
    description?: string;
    templateId?: string;
    duplicateOf?: string;
  },
  userId: string,
  email?: string,
) => {
  if (data.templateId) return createDesignFromTemplate(data.templateId, userId, data.name);

  let canvasData: Prisma.InputJsonValue = emptyCanvas();
  if (data.duplicateOf) {
    const source = await prisma.design.findFirst({
      where: readableDesignWhere(data.duplicateOf, userId, email),
      select: { canvasData: true },
    });
    if (!source) return null;
    canvasData = source.canvasData as Prisma.InputJsonValue;
  }

  const design = await prisma.design.create({
    data: {
      name: data.name,
      description: data.description,
      canvasData,
      userId,
    },
  });

  return serializeDesign(design);
};

export const getDesignById = async (
  id: string,
  viewer: { userId?: string; email?: string; code?: string },
) => {
  if (viewer.code) {
    const link = await findDesignByLinkCode(viewer.code);
    if (!link || link.design.id !== id) return null;

    const { user, ...design } = link.design;
    return { ...serializeDesign(design), permission: link.permission, ownerName: user.name };
  }

  if (!viewer.userId) return null;

  const found = await prisma.design.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });

  if (!found) return null;

  const permission = await getDesignPermission(found, viewer.userId, viewer.email);
  if (!permission) return null;

  const { user, ...design } = found;
  return { ...serializeDesign(design), permission, ownerName: user.name };
};

export const listDesigns = async (
  userId: string,
  email: string | undefined,
  filters: {
    scope?: string;
    search?: string;
    sortBy?: string;
    order?: string;
    limit?: string;
    offset?: string;
  },
) => {
  const sortBy = filters.sortBy || "updatedAt";
  const order = filters.order || "desc";
  const limit = Math.min(filters.limit ? parseInt(filters.limit, 10) : 50, 100);
  const offset = filters.offset ? parseInt(filters.offset, 10) : 0;

  const scope = filters.scope ?? "owned";
  const reach: Prisma.DesignWhereInput[] = [];
  if (scope !== "shared") reach.push({ userId });
  if (scope !== "owned" && email) reach.push({ members: { some: { email } } });

  if (!reach.length) return { designs: [], total: 0, limit, offset };

  const where: Prisma.DesignWhereInput = { OR: reach };

  if (filters.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where,
      include: withOwner(email),
      orderBy: { [sortBy]: order },
      take: limit,
      skip: offset,
    }),
    prisma.design.count({ where }),
  ]);

  return {
    designs: designs.map(({ user, members, ...design }) => ({
      ...serializeDesignSummary(design),
      permission: design.userId === userId ? "owner" : (members[0]?.permission ?? "readonly"),
      ownerName: user.name,
      ownerEmail: user.email,
    })),
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
    canvasData?: Canvas;
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
