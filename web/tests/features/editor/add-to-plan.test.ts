import { describe, test, expect } from "bun:test";
import { quickAddPosition } from "@/features/editor/furniture-catalog/add-to-plan";
import { QUICK_ADD_AT } from "@/lib/constants";
import type { Canvas, Vec2 } from "@/shared/canvas";

type Placeable = Pick<Canvas, "walls" | "rooms" | "furniture">;

type Case = {
  name: string;
  canvas: Placeable;
  expected: Vec2;
};

const cases: Case[] = [
  {
    name: "empty canvas falls back to the default spot",
    canvas: { walls: [], rooms: [], furniture: [] },
    expected: QUICK_ADD_AT,
  },
  {
    name: "one wall places at its centre",
    canvas: {
      walls: [{ id: "w", from: [0, 0], to: [4000, 3000], thickness: 120, height: 2700 }],
      rooms: [],
      furniture: [],
    },
    expected: [2000, 1500],
  },
  {
    name: "odd bounds round to whole millimetres",
    canvas: {
      walls: [{ id: "w", from: [0, 0], to: [4001, 3001], thickness: 120, height: 2700 }],
      rooms: [],
      furniture: [],
    },
    expected: [2001, 1501],
  },
  {
    name: "furniture and rooms count toward the bounds",
    canvas: {
      walls: [],
      rooms: [
        {
          id: "r",
          name: "Living",
          usage: "living_room",
          polygon: [
            [0, 0],
            [2000, 0],
            [2000, 2000],
          ],
        },
      ],
      furniture: [{ id: "f", item: "sofa", at: [6000, 4000], rotation: 0 }],
    },
    expected: [3000, 2000],
  },
];

describe("quickAddPosition", () => {
  test.each(cases)("$name", ({ canvas, expected }) => {
    expect(quickAddPosition(canvas)).toEqual(expected);
  });
});
