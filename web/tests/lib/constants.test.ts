import { describe, test, expect } from "bun:test";
import {
  EXPORT_HIDDEN_LAYER_NAME,
  PIXELS_PER_FOOT,
  feetToPx,
  pxToFeet,
  pxToSquareFeet,
} from "@/lib/constants";

describe("unit conversion", () => {
  test("one foot is PIXELS_PER_FOOT pixels", () => {
    expect(feetToPx(1)).toBe(PIXELS_PER_FOOT);
    expect(pxToFeet(PIXELS_PER_FOOT)).toBe(1);
  });

  test("pxToFeet and feetToPx are inverses", () => {
    for (const px of [0, 1, 30, 240, 1234.5]) {
      expect(feetToPx(pxToFeet(px))).toBeCloseTo(px, 10);
    }
  });

  test("handles zero and negatives", () => {
    expect(pxToFeet(0)).toBe(0);
    expect(feetToPx(0)).toBe(0);
    expect(pxToFeet(-60)).toBe(-2);
    expect(feetToPx(-2)).toBe(-60);
  });

  test("area conversion squares the factor", () => {
    expect(pxToSquareFeet(PIXELS_PER_FOOT * PIXELS_PER_FOOT)).toBe(1);
    expect(pxToSquareFeet(0)).toBe(0);
  });

  test("area conversion agrees with the linear one", () => {
    const sideFt = 12;
    const sidePx = feetToPx(sideFt);
    expect(pxToSquareFeet(sidePx * sidePx)).toBeCloseTo(sideFt * sideFt, 10);
  });

  test("a 10x12 ft room measures 120 sq ft", () => {
    expect(pxToSquareFeet(feetToPx(10) * feetToPx(12))).toBeCloseTo(120, 10);
  });
});

describe("EXPORT_HIDDEN_LAYER_NAME", () => {
  test("is a valid Konva selector name", () => {
    expect(EXPORT_HIDDEN_LAYER_NAME).toMatch(/^[a-zA-Z][\w-]*$/);
  });
});
