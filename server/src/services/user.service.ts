import { prisma } from "../lib/db";
import { httpError } from "../lib/http-error";
import { planOf } from "../lib/plan";

export const getMe = async (userId: string) => {
  const [user, plan] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    planOf(userId),
  ]);
  if (!user) throw httpError(404, "USER_NOT_FOUND");

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan,
    createdAt: user.createdAt.toISOString(),
  };
};
