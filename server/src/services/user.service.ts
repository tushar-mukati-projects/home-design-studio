import { prisma } from "../lib/db";
import { serializeDate } from "../lib/serializers";

// The first call every signed-in page makes. It also settles the user row's existence,
// since requireAuth creates it on first sight of a token.
export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: { select: { plan: true } } },
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan ?? "free",
    createdAt: serializeDate(user.createdAt),
  };
};
