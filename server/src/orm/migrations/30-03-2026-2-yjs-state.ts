import type { PrismaClient } from "@prisma/client";

export const up = async (prisma: PrismaClient) => {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "designs" ADD COLUMN IF NOT EXISTS "yjs_state" BYTEA
  `);
};
