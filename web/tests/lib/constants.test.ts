import { describe, test, expect } from "bun:test";
import {
  EXPORT_HIDDEN_LAYER_NAME,
  GRID_MM,
  PX_PER_MM,
  formatArea,
  formatLength,
  mmToPx,
  pxToMm,
} from "@/lib/constants";

describe("render scale", () => {
  test("a 6 m wall is 600 px at zoom 1", () => {
    expect(mmToPx(6000)).toBe(600);
  });

  test("mmToPx and pxToMm are inverses", () => {
    for (const mm of [0, 1, 120, 4064, 12345.5]) {
      expect(pxToMm(mmToPx(mm))).toBeCloseTo(mm, 10);
    }
  });

  test("the grid is a whole number of millimetres that divides a metre", () => {
    expect(Number.isInteger(GRID_MM)).toBe(true);
    expect(1000 % GRID_MM).toBe(0);
  });

  test("PX_PER_MM is the only place the screen scale lives", () => {
    expect(PX_PER_MM).toBe(0.1);
  });
});

describe("formatting", () => {
  test("lengths read in metres with two decimals", () => {
    expect(formatLength(4064)).toBe("4.06 m");
    expect(formatLength(0)).toBe("0.00 m");
  });

  test("areas read in square metres with one decimal", () => {
    expect(formatArea(12_000_000)).toBe("12.0 m²");
  });
});

describe("EXPORT_HIDDEN_LAYER_NAME", () => {
  test("is a valid Konva selector name", () => {
    expect(EXPORT_HIDDEN_LAYER_NAME).toMatch(/^[a-zA-Z][\w-]*$/);
  });
});
