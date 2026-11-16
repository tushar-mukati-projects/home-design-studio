import { applyToCollabDoc, closeCollabConnections } from "../collaboration/hocuspocus";
import { prisma } from "../lib/db";
import {
  designWhere,
  getDesignPermission,
  requireDesign,
  type DesignRef,
} from "../lib/design-access";
import { httpError } from "../lib/http-error";
import { logger } from "../lib/logger";
import { planOf } from "../lib/plan";
import { serializeDesign, serializeDesignSummary } from "../lib/serializers";
import { DESIGN_PERMISSIONS, PLANS, emptyCanvas, type DesignPermission } from "../shared/canvas";
import type { Prisma } from "@prisma/client";
import type {
  CreateDesignBody,
  ListDesignsQuery,
  UpdateDesignBody,
} from "../schemas/design.schema";

const DESIGN_CREATE_TX_TIMEOUT_MS = 15_000;

type Viewer = { userId?: string; email?: string; code?: string };
type DesignSource = Pick<Prisma.DesignUncheckedCreateInput, "canvasData" | "description">;

const withOwner = (email?: string) => ({
  user: { select: { name: true, email: true } },
  members: { where: { email: email ?? "" }, select: { permission: true } },
});

export const createDesign = async (body: CreateDesignBody, userId: string, email?: string) => {
  const source = await designSource(body, userId, email);

  const design = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      const { designLimit } = PLANS[await planOf(userId, tx)];
      const count = await tx.design.count({ where: { userId } });
      if (count >= designLimit) {
        logger.warn("Design limit reached", { userId, designLimit });
        throw httpError(403, "DESIGN_LIMIT_REACHED", { limit: designLimit });
      }
      return tx.design.create({ data: { ...source, name: body.name, userId } });
    },
    { timeout: DESIGN_CREATE_TX_TIMEOUT_MS },
  );

  return serializeDesign(design);
};

export const getDesignById = async (id: string, viewer: Viewer) => {
  const found = await prisma.design.findUnique({
    where: { id },
    include: { user: { select: { name: true } } },
  });
  if (!found) throw httpError(404, "DESIGN_NOT_FOUND");

  const permission = await viewerPermission(found, viewer);
  if (!permission) {
    logger.warn("Design access refused", { designId: id, userId: viewer.userId });
    throw httpError(404, "DESIGN_NOT_FOUND");
  }

  const { user, ...design } = found;
  return { ...serializeDesign(design), permission, ownerName: user.name };
};

export const listDesigns = async (
  userId: string,
  email: string | undefined,
  query: ListDesignsQuery,
) => {
  const { limit, offset } = query;
  const where = listFilter(userId, email, query);
  if (!where) return { designs: [], total: 0, limit, offset };

  const [designs, total] = await Promise.all([
    prisma.design.findMany({
      where,
      include: withOwner(email),
      orderBy: { [query.sortBy]: query.order },
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
  body: UpdateDesignBody,
  userId: string,
  email?: string,
) => {
  await requireDesign(
    designWhere(id, userId, email, "readwrite"),
    { id: true },
    "DESIGN_NOT_FOUND",
  );

  const { canvasData, ...fields } = body;
  await prisma.design.update({ where: { id }, data: fields });

  if (canvasData !== undefined || body.name !== undefined) {
    await applyToCollabDoc(id, { canvas: canvasData, name: body.name });
  }

  return serializeDesign(await prisma.design.findUniqueOrThrow({ where: { id } }));
};

export const deleteDesign = async (id: string, userId: string) => {
  const { count } = await prisma.design.deleteMany({ where: { id, userId } });
  if (count === 0) throw httpError(404, "DESIGN_NOT_FOUND");
  closeCollabConnections(id);
};

const designSource = async (
  body: CreateDesignBody,
  userId: string,
  email?: string,
): Promise<DesignSource> => {
  if (body.templateId) {
    const template = await prisma.designTemplate.findUnique({
      where: { id: body.templateId },
      select: { canvasData: true, description: true },
    });
    if (!template) throw httpError(404, "TEMPLATE_NOT_FOUND");
    return {
      canvasData: template.canvasData as Prisma.InputJsonValue,
      description: template.description,
    };
  }

  if (body.duplicateOf) {
    const copied = await requireDesign(
      designWhere(body.duplicateOf, userId, email, "readonly"),
      { canvasData: true },
      "COPY_SOURCE_NOT_FOUND",
    );
    return {
      canvasData: copied.canvasData as Prisma.InputJsonValue,
      description: body.description,
    };
  }

  return { canvasData: emptyCanvas(), description: body.description };
};

const viewerPermission = async (
  design: DesignRef,
  viewer: Viewer,
): Promise<DesignPermission | null> => {
  const granted = await Promise.all([
    viewer.userId ? getDesignPermission(design, viewer.userId, viewer.email) : null,
    viewer.code ? linkPermission(design.id, viewer.code) : null,
  ]);
  return DESIGN_PERMISSIONS.find((permission) => granted.includes(permission)) ?? null;
};

const linkPermission = async (designId: string, code: string) => {
  const link = await prisma.designLink.findUnique({
    where: { code },
    select: { designId: true, permission: true, expiresAt: true },
  });
  if (!link || link.designId !== designId) return null;
  if (link.expiresAt && link.expiresAt <= new Date()) return null;
  return link.permission;
};

const listFilter = (
  userId: string,
  email: string | undefined,
  query: ListDesignsQuery,
): Prisma.DesignWhereInput | null => {
  const reach: Prisma.DesignWhereInput[] = [];
  if (query.scope !== "shared") reach.push({ userId });
  if (query.scope !== "owned" && email) reach.push({ members: { some: { email } } });
  if (!reach.length) return null;

  const where: Prisma.DesignWhereInput = { OR: reach };
  if (query.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: query.search, mode: "insensitive" } },
          { description: { contains: query.search, mode: "insensitive" } },
        ],
      },
    ];
  }
  return where;
};
