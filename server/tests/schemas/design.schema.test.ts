import { describe, test, expect } from "bun:test";
import { listDesignsSchema } from "@/schemas/design.schema";

describe("listDesignsSchema", () => {
  test("fills in the paging and sorting defaults", () => {
    expect(listDesignsSchema.parse({ query: {} }).query).toEqual({
      scope: "owned",
      sortBy: "updatedAt",
      order: "desc",
      limit: 50,
      offset: 0,
    });
  });

  test("coerces the query strings to numbers", () => {
    const { query } = listDesignsSchema.parse({ query: { limit: "20", offset: "40" } });
    expect(query.limit).toBe(20);
    expect(query.offset).toBe(40);
  });

  test.each([
    ["a limit above the page cap", { limit: "101" }],
    ["a negative offset", { offset: "-1" }],
    ["a fractional limit", { limit: "1.5" }],
    ["a non-numeric limit", { limit: "ten" }],
    ["an unknown scope", { scope: "everyone" }],
  ])("rejects %s", (_label, query) => {
    expect(listDesignsSchema.safeParse({ query }).success).toBe(false);
  });
});
