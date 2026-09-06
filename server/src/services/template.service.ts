import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import { DEFAULT_TEMPLATES } from "../lib/seed-data/templates";
import { serializeDesign } from "../lib/serializers";
import type { Canvas } from "../schemas/canvas.schema";

export const listTemplates = () =>
  prisma.designTemplate.findMany({ orderBy: { sortOrder: "asc" } });

export const createDesignFromTemplate = async (
  templateId: string,
  userId: string,
  name: string,
) => {
  const template = await prisma.designTemplate.findUnique({ where: { id: templateId } });
  if (!template) return null;

  const canvas = template.canvasData as Canvas;
  const design = await prisma.design.create({
    data: {
      name,
      description: template.description,
      canvasData: canvas as unknown as Prisma.InputJsonValue,
      userId,
    },
  });

  return serializeDesign(design);
};

export const seedTemplates = async () => {
  if ((await prisma.designTemplate.count()) > 0) return;

  await prisma.designTemplate.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      canvasData: t.canvasData as unknown as Prisma.InputJsonValue,
      sortOrder: t.sortOrder,
    })),
  });

  logger.info(`Seeded ${DEFAULT_TEMPLATES.length} design templates`);
};
