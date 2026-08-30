import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import { DEFAULT_TEMPLATES } from "../lib/seed-data/templates";
import { serializeDesign } from "../lib/serializers";
import { buildYjsState } from "../collaboration/yjs-doc";
import type { Prisma } from "@prisma/client";

export const listTemplates = async () => {
  const templates = await prisma.designTemplate.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return templates;
};

export const createDesignFromTemplate = async (
  templateId: string,
  userId: string,
  name: string,
) => {
  const template = await prisma.designTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return null;

  const items = await prisma.furnitureItem.findMany({
    where: { isDefault: true },
    select: { id: true, icon: true },
  });
  const idBySlug = new Map(items.filter((i) => i.icon).map((i) => [i.icon as string, i.id]));

  const canvasData = template.canvasData as Record<string, unknown>;
  const furniture = Array.isArray(canvasData.furniture)
    ? (canvasData.furniture as Array<Record<string, unknown>>)
        .map((f) => {
          const realId = idBySlug.get(f.furnitureItemId as string);
          if (!realId) return null;
          const item = f.furnitureItem as Record<string, unknown> | undefined;
          return {
            ...f,
            furnitureItemId: realId,
            furnitureItem: item ? { ...item, id: realId } : item,
          };
        })
        .filter(Boolean)
    : [];

  const resolvedCanvasData = { ...canvasData, furniture };

  const design = await prisma.design.create({
    data: {
      name,
      description: template.description,
      canvasData: resolvedCanvasData as Prisma.InputJsonValue,
      yjsState: buildYjsState(resolvedCanvasData),
      width: template.width,
      height: template.height,
      userId,
    },
  });

  return serializeDesign(design);
};

export const seedTemplates = async () => {
  const count = await prisma.designTemplate.count();
  if (count > 0) return;

  await prisma.designTemplate.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      canvasData: t.canvasData as unknown as Prisma.InputJsonValue,
      width: t.width,
      height: t.height,
      sortOrder: t.sortOrder,
    })),
  });

  logger.info(`Seeded ${DEFAULT_TEMPLATES.length} design templates`);
};
