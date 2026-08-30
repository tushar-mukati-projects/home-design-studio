import { describe, test, expect } from "bun:test";
import { PLANS, DEFAULT_FURNITURE_ITEMS, FurnitureCategory } from "@/lib/constants";

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

describe("DEFAULT_FURNITURE_ITEMS", () => {
  test("is non-empty", () => {
    expect(DEFAULT_FURNITURE_ITEMS.length).toBeGreaterThan(0);
  });

  test("every item has positive dimensions", () => {
    for (const item of DEFAULT_FURNITURE_ITEMS) {
      expect(item.width).toBeGreaterThan(0);
      expect(item.height).toBeGreaterThan(0);
      expect(item.depth).toBeGreaterThan(0);
    }
  });

  test("every item uses a known category", () => {
    const known = new Set<string>(Object.values(FurnitureCategory));
    for (const item of DEFAULT_FURNITURE_ITEMS) {
      expect(known.has(item.category)).toBe(true);
    }
  });

  test("names are unique, so seeding cannot create duplicates", () => {
    const names = DEFAULT_FURNITURE_ITEMS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  test("icons are unique, so the canvas can render each item distinctly", () => {
    const icons = DEFAULT_FURNITURE_ITEMS.map((i) => i.icon).filter(Boolean);
    expect(new Set(icons).size).toBe(icons.length);
  });

  test("colors are 6-digit hex", () => {
    for (const item of DEFAULT_FURNITURE_ITEMS) {
      expect(item.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
