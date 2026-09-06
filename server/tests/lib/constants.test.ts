import { describe, test, expect } from "bun:test";
import { PLANS } from "@/lib/constants";

describe("PLANS", () => {
  test("free is limited and has no sharing or AI", () => {
    expect(PLANS.free).toEqual({ designLimit: 3, canShare: false, canUseAI: false });
  });

  test("pro is unlimited with sharing and AI", () => {
    expect(PLANS.pro.canShare).toBe(true);
    expect(PLANS.pro.canUseAI).toBe(true);
    expect(Number.isFinite(PLANS.pro.designLimit)).toBe(false);
  });

  test("an unlimited designLimit would be lost by JSON, so it must be mapped", () => {
    expect(JSON.parse(JSON.stringify({ limit: PLANS.pro.designLimit })).limit).toBeNull();
  });
});
