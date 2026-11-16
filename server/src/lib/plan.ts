import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { PlanName } from "../shared/canvas";

export const planOf = async (
  userId: string,
  db: Prisma.TransactionClient = prisma,
): Promise<PlanName> => {
  const subscription = await db.subscription.findUnique({
    where: { userId },
    select: { plan: true },
  });
  return subscription?.plan ?? "free";
};
