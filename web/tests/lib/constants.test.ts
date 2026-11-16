import { describe, test, expect } from "bun:test";
import {
  EXPORT_HIDDEN_LAYER_NAME,
  GRID_MM,
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  formatArea,
  formatLength,
} from "@/lib/constants";

describe("render scale", () => {
  test("the grid is a whole number of millimetres that divides a metre", () => {
    expect(Number.isInteger(GRID_MM)).toBe(true);
    expect(1000 % GRID_MM).toBe(0);
  });

  test.each([
    [0, MIN_ZOOM],
    [1, 1],
    [99, MAX_ZOOM],
  ])("clampZoom(%p) is %p", (zoom, expected) => {
    expect(clampZoom(zoom)).toBe(expected);
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
