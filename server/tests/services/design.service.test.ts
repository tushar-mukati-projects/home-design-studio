import { describe, test, expect, mock, beforeEach } from "bun:test";

type CreateArgs = { data: Record<string, unknown> };
type Permission = "readonly" | "readwrite";

const state = {
  plan: null as { plan: "free" | "pro" } | null,
  count: 0,
  member: null as { permission: Permission } | null,
  link: null as { designId: string; permission: Permission; expiresAt: Date | null } | null,
};
const calls: string[] = [];
const lockedSql: string[] = [];

const tx = {
  $queryRaw: mock(async (sql: TemplateStringsArray) => {
    calls.push("lock");
    lockedSql.push(sql.join("?"));
    return [];
  }),
  subscription: { findUnique: mock(async () => state.plan) },
  design: {
    count: mock(async () => {
      calls.push("count");
      return state.count;
    }),
    create: mock(async ({ data }: CreateArgs) => {
      calls.push("create");
      return {
        id: "d1",
        description: null,
        thumbnail: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        ...data,
      };
    }),
  },
};

const prisma = {
  $transaction: mock(async (run: (client: typeof tx) => Promise<unknown>) => run(tx)),
  design: {
    findUnique: mock(async () => ({
      id: "d1",
      userId: "owner",
      name: "Plan",
      description: null,
      thumbnail: null,
      canvasData: {},
      createdAt: new Date(0),
      updatedAt: new Date(0),
      user: { name: "Owner" },
    })),
  },
  designMember: { findUnique: mock(async () => state.member) },
  designLink: { findUnique: mock(async () => state.link) },
};

mock.module("@/lib/db", () => ({ prisma }));
mock.module("@/lib/config", () => ({
  config: { nodeEnv: "test", logLevel: "error" },
  disabledFeatures: () => [],
}));
mock.module("@/collaboration/hocuspocus", () => ({
  applyToCollabDoc: async () => {},
  closeCollabConnections: () => {},
  closeMemberConnections: () => {},
  currentCanvas: (_id: string, canvas: unknown) => canvas,
}));

const { createDesign, getDesignById } = await import("@/services/design.service");

const allMocks = [
  tx.$queryRaw,
  tx.subscription.findUnique,
  tx.design.count,
  tx.design.create,
  prisma.$transaction,
  prisma.design.findUnique,
  prisma.designMember.findUnique,
  prisma.designLink.findUnique,
];

beforeEach(() => {
  state.plan = null;
  state.count = 0;
  state.member = null;
  state.link = null;
  calls.length = 0;
  lockedSql.length = 0;
  for (const fn of allMocks) fn.mockClear();
});

describe("createDesign", () => {
  test.each([
    ["a free user under the limit", null, 2, true],
    ["a free user at the limit", null, 3, false],
    ["a pro user far past the free limit", { plan: "pro" as const }, 50, true],
  ])("%s", async (_label, plan, count, created) => {
    state.plan = plan;
    state.count = count;

    const attempt = createDesign({ name: "Plan" }, "u1");
    if (created) {
      expect((await attempt).name).toBe("Plan");
    } else {
      await expect(attempt).rejects.toMatchObject({
        status: 403,
        code: "DESIGN_LIMIT_REACHED",
        details: { limit: 3 },
      });
    }
    expect(tx.design.create).toHaveBeenCalledTimes(created ? 1 : 0);
  });

  test("locks the owner row FOR UPDATE, then counts, then creates, in one transaction", async () => {
    await createDesign({ name: "Plan" }, "u1");

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(lockedSql).toHaveLength(1);
    expect(lockedSql[0]).toContain("FOR UPDATE");
    expect(calls).toEqual(["lock", "count", "create"]);
    expect(tx.design.count).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });
});

describe("getDesignById", () => {
  test.each([
    ["a read-only member with a read-write link can edit", "readonly", "readwrite", "readwrite"],
    ["a read-write member with a read-only link can edit", "readwrite", "readonly", "readwrite"],
    ["a read-only member with no link can only view", "readonly", null, "readonly"],
    ["a stranger with a read-only link can only view", null, "readonly", "readonly"],
  ] as const)("%s", async (_label, member, link, expected) => {
    state.member = member ? { permission: member } : null;
    state.link = link ? { designId: "d1", permission: link, expiresAt: null } : null;

    const design = await getDesignById("d1", {
      userId: "u2",
      email: "member@example.com",
      code: link ? "code" : undefined,
    });
    expect(design.permission).toBe(expected);
  });

  test("the owner stays owner when opening a read-only link", async () => {
    state.link = { designId: "d1", permission: "readonly", expiresAt: null };
    const design = await getDesignById("d1", { userId: "owner", code: "code" });
    expect(design.permission).toBe("owner");
  });
});
