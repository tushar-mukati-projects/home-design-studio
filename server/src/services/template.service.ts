import { z } from "zod";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import templates from "../lib/seed-data/templates.json";
import { canvasSchema } from "../shared/canvas";
import type { Prisma } from "@prisma/client";

const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  sortOrder: z.number().int(),
  canvasData: canvasSchema,
});

export const listTemplates = () =>
  prisma.designTemplate.findMany({ orderBy: { sortOrder: "asc" } });

export const seedTemplates = async () => {
  if ((await prisma.designTemplate.count()) > 0) return;

  const rows = z.array(templateSchema).parse(templates);
  await prisma.designTemplate.createMany({
    data: rows.map((t) => ({ ...t, canvasData: t.canvasData as Prisma.InputJsonValue })),
  });

  logger.info(`Seeded ${rows.length} design templates`);
};
