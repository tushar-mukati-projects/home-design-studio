import { describe, test, expect } from "bun:test";
import { addMemberSchema, createLinkSchema } from "@/schemas/share.schema";

const params = { id: "11111111-1111-4111-8111-111111111111" };

describe("addMemberSchema", () => {
  test("trims and lowercases the email before validating it", () => {
    const parsed = addMemberSchema.parse({ params, body: { email: "  Ann@Example.COM " } });
    expect(parsed.body.email).toBe("ann@example.com");
  });

  test("permission defaults to readonly", () => {
    const parsed = addMemberSchema.parse({ params, body: { email: "a@b.co" } });
    expect(parsed.body.permission).toBe("readonly");
  });

  test.each([
    ["not an email", { email: "nope" }],
    ["an unknown permission", { email: "a@b.co", permission: "admin" }],
  ])("rejects %s", (_label, body) => {
    expect(addMemberSchema.safeParse({ params, body }).success).toBe(false);
  });
});

describe("createLinkSchema", () => {
  test("a future expiry becomes a Date", () => {
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    const parsed = createLinkSchema.parse({ params, body: { expiresAt } });
    expect(parsed.body.expiresAt).toBeInstanceOf(Date);
    expect(parsed.body.expiresAt?.toISOString()).toBe(expiresAt);
  });

  test("a past expiry is rejected", () => {
    const expiresAt = new Date(Date.now() - 60_000).toISOString();
    expect(createLinkSchema.safeParse({ params, body: { expiresAt } }).success).toBe(false);
  });

  test("no expiry means a permanent link", () => {
    const parsed = createLinkSchema.parse({ params, body: {} });
    expect(parsed.body.expiresAt).toBeUndefined();
    expect(parsed.body.permission).toBe("readonly");
  });
});
