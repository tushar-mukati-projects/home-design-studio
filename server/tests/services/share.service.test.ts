import { describe, test, expect, mock, beforeEach } from "bun:test";
import { Prisma } from "@prisma/client";

type Permission = "readonly" | "readwrite";
type UpsertArgs = { create: { email: string; permission: Permission } };

const OWNER_EMAIL = "owner@example.com";
const MEMBER_EMAIL = "member@example.com";

const state = { previous: null as { permission: Permission } | null, removable: true };

const prisma = {
  design: {
    findFirst: mock(async () => ({
      id: "d1",
      name: "Plan",
      userId: "owner",
      user: { name: "Owner", email: OWNER_EMAIL },
    })),
  },
  designMember: {
    findUnique: mock(async () => state.previous),
    upsert: mock(async ({ create }: UpsertArgs) => ({ id: "m1", designId: "d1", ...create })),
    delete: mock(async () => {
      if (state.removable) return { email: MEMBER_EMAIL };
      throw new Prisma.PrismaClientKnownRequestError("missing", {
        code: "P2025",
        clientVersion: "test",
      });
    }),
  },
};

const closeMemberConnections = mock((_designId: string, _email: string) => {});
const closeCollabConnections = mock((_designId: string) => {});
const sendShareInviteEmail = mock(async (_invite: unknown) => {});

mock.module("@/lib/db", () => ({ prisma }));
mock.module("@/lib/config", () => ({
  config: { nodeEnv: "test", logLevel: "error" },
  disabledFeatures: () => [],
}));
mock.module("@/collaboration/hocuspocus", () => ({
  applyToCollabDoc: async () => {},
  closeCollabConnections,
  closeMemberConnections,
  currentCanvas: (_id: string, canvas: unknown) => canvas,
}));
mock.module("@/services/email.service", () => ({ sendShareInviteEmail }));

const { addMember, removeMember } = await import("@/services/share.service");

const allMocks = [
  prisma.design.findFirst,
  prisma.designMember.findUnique,
  prisma.designMember.upsert,
  prisma.designMember.delete,
  closeMemberConnections,
  closeCollabConnections,
  sendShareInviteEmail,
];

beforeEach(() => {
  state.previous = null;
  state.removable = true;
  for (const fn of allMocks) fn.mockClear();
});

describe("addMember", () => {
  test.each([
    ["a new member is emailed and nobody is disconnected", null, "readonly", 1, 0],
    ["a permission change disconnects only that member", "readwrite", "readonly", 0, 1],
    ["a re-invite with the same permission does nothing", "readonly", "readonly", 0, 0],
  ] as const)("%s", async (_label, previous, permission, emails, closes) => {
    state.previous = previous ? { permission: previous } : null;

    await addMember("d1", "owner", { email: MEMBER_EMAIL, permission });

    expect(sendShareInviteEmail).toHaveBeenCalledTimes(emails);
    expect(closeMemberConnections).toHaveBeenCalledTimes(closes);
    if (closes) expect(closeMemberConnections).toHaveBeenCalledWith("d1", MEMBER_EMAIL);
    expect(closeCollabConnections).not.toHaveBeenCalled();
  });

  test("sharing with yourself is refused before anything is written", async () => {
    await expect(
      addMember("d1", "owner", { email: OWNER_EMAIL, permission: "readonly" }),
    ).rejects.toMatchObject({ status: 400, code: "SHARE_SELF" });
    expect(prisma.designMember.upsert).not.toHaveBeenCalled();
  });
});

describe("removeMember", () => {
  test("disconnects only the removed member", async () => {
    await removeMember("d1", "m1", "owner");
    expect(closeMemberConnections).toHaveBeenCalledWith("d1", MEMBER_EMAIL);
    expect(closeCollabConnections).not.toHaveBeenCalled();
  });

  test("a member that is not there, or not on the caller's design, is a 404", async () => {
    state.removable = false;
    await expect(removeMember("d1", "m1", "stranger")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
    expect(closeMemberConnections).not.toHaveBeenCalled();
  });
});
