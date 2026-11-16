import { describe, test, expect, mock, beforeEach } from "bun:test";

type Token = { uid: string; email?: string; email_verified?: boolean; name?: string };
type StoredUser = { id: string; authSub: string; email: string | null; name: string | null };
type UpdateArgs = { where: { id: string }; data: Partial<StoredUser> };

const tokens = new Map<string, Token>();
const users = new Map<string, StoredUser>();

const verifyIdToken = mock(async (token: string) => {
  const decoded = tokens.get(token);
  if (!decoded) throw new Error("bad token");
  return decoded;
});

const prisma = {
  user: {
    findUnique: mock(async ({ where }: { where: { authSub: string } }) =>
      users.has(where.authSub) ? { ...users.get(where.authSub) } : null,
    ),
    create: mock(async ({ data }: { data: Omit<StoredUser, "id"> }) => {
      const user = { id: `id-${data.authSub}`, ...data, email: data.email ?? null };
      users.set(data.authSub, user);
      return user;
    }),
    updateMany: mock(async ({ where, data }: UpdateArgs) => {
      for (const user of users.values()) if (user.id === where.id) Object.assign(user, data);
      return { count: 1 };
    }),
  },
};

mock.module("firebase-admin/app", () => ({
  initializeApp: () => ({}),
  cert: () => ({}),
  getApps: () => [],
}));
mock.module("firebase-admin/auth", () => ({ getAuth: () => ({ verifyIdToken }) }));
mock.module("@/lib/db", () => ({ prisma }));
mock.module("@/lib/config", () => ({
  config: {
    firebase: { projectId: "demo-test", clientEmail: "x", privateKey: "x" },
    nodeEnv: "test",
    logLevel: "error",
  },
  disabledFeatures: () => [],
}));

const { requireAuth } = await import("@/middleware/auth");

const signIn = (token: string) =>
  new Promise<{ auth?: { userId: string; email?: string } }>((resolve, reject) => {
    const req = { headers: { authorization: `Bearer ${token}` } } as {
      headers: object;
      auth?: { userId: string; email?: string };
    };
    requireAuth(req as never, {} as never, (error?: unknown) =>
      error ? reject(error) : resolve(req),
    );
  });

beforeEach(() => {
  tokens.clear();
  users.clear();
  verifyIdToken.mockClear();
  prisma.user.findUnique.mockClear();
  prisma.user.create.mockClear();
  prisma.user.updateMany.mockClear();
});

describe("requireAuth", () => {
  test("a sign-up stores the email prefix as the name until the token carries a name", async () => {
    tokens.set("t1", { uid: "new-user", email: "Ada@Example.com", email_verified: false });
    await signIn("t1");
    expect(users.get("new-user")).toMatchObject({ email: null, name: "Ada" });

    tokens.set("t2", { uid: "new-user", email: "Ada@Example.com", email_verified: true });
    const verified = await signIn("t2");
    expect(verified.auth?.email).toBe("ada@example.com");
    expect(users.get("new-user")).toMatchObject({ email: "ada@example.com", name: "Ada" });

    tokens.set("t3", {
      uid: "new-user",
      email: "Ada@Example.com",
      email_verified: true,
      name: "Ada Lovelace",
    });
    await signIn("t3");
    expect(users.get("new-user")).toMatchObject({ email: "ada@example.com", name: "Ada Lovelace" });
    expect(prisma.user.updateMany).toHaveBeenCalledTimes(2);
  });

  test("an unchanged profile writes nothing", async () => {
    users.set("steady", { id: "u1", authSub: "steady", email: "s@example.com", name: "Sam" });
    tokens.set("t", { uid: "steady", email: "s@example.com", email_verified: true, name: "Sam" });

    await signIn("t");
    await signIn("t");

    expect(prisma.user.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
  });

  test("an unverified email never replaces the stored one", async () => {
    users.set("unverified", { id: "u2", authSub: "unverified", email: null, name: "Kim" });
    tokens.set("t", { uid: "unverified", email: "kim@example.com", email_verified: false });

    const { auth } = await signIn("t");

    expect(auth?.email).toBeUndefined();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
