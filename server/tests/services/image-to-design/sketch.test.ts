import { describe, test, expect } from "bun:test";
import { sketchSchema, toCanvas } from "@/services/image-to-design/sketch";
import { FURNITURE_CATALOG } from "@/lib/seed-data/furniture";
import { DEFAULTS, canvasSchema } from "@/shared/canvas";

const item = FURNITURE_CATALOG[0];

const square = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 80 },
  { x: 0, y: 80 },
];

const sketch = sketchSchema.parse({
  walls: [
    { x1: 0, y1: 0, x2: 100, y2: 0 },
    { x1: 100, y1: 0, x2: 100, y2: 80 },
  ],
  doors: [
    { wallIndex: 0, position: 0.5, type: "sliding" },
    { wallIndex: 1, position: -3, type: "revolving" },
    { wallIndex: 9, position: 0.5 },
  ],
  windows: [{ wallIndex: 1, position: 2 }],
  rooms: [
    { name: "", type: "kitchen", points: square },
    { name: "Hall", type: "lounge", points: square },
    { name: "Line", type: "hallway", points: square.slice(0, 2) },
  ],
  furniture: [
    { name: item.name.toUpperCase(), x: 50, y: 40 },
    { name: item.name, x: 500, y: 40, rotation: 90 },
    { name: "Spaceship", x: 50, y: 40 },
    { name: item.name, x: 20, y: 20, rotation: "sideways" },
  ],
});

const canvas = toCanvas(sketch);

describe("toCanvas", () => {
  test("produces a canvas the shared schema accepts", () => {
    expect(canvasSchema.safeParse(canvas).success).toBe(true);
  });

  test("scales wall pixels to millimetres with the default thickness and height", () => {
    expect(
      canvas.walls.map(({ from, to, thickness, height }) => [from, to, thickness, height]),
    ).toEqual([
      [[0, 0], [1000, 0], DEFAULTS.wallThickness, DEFAULTS.wallHeight],
      [[1000, 0], [1000, 800], DEFAULTS.wallThickness, DEFAULTS.wallHeight],
    ]);
  });

  test("places openings along their wall, clamps the position and drops unknown wall indexes", () => {
    const [first, second] = canvas.walls;
    expect(
      canvas.openings.map(({ kind, wall, offset, variant }) => [kind, wall, offset, variant]),
    ).toEqual([
      ["door", first?.id, 500, "sliding"],
      ["door", second?.id, 0, "single"],
      ["window", second?.id, 800, undefined],
    ]);
    expect(canvas.openings[2]).toMatchObject({
      width: DEFAULTS.window.width,
      sill: DEFAULTS.window.sill,
    });
  });

  test("names unnamed rooms, maps unknown usages to generic and drops rooms with under 3 points", () => {
    expect(canvas.rooms.map(({ name, usage, polygon }) => [name, usage, polygon.length])).toEqual([
      ["Room", "kitchen", 4],
      ["Hall", "generic", 4],
    ]);
    expect(canvas.rooms[0]?.polygon[2]).toEqual([1000, 800]);
  });

  test("keeps only catalog furniture whose centre lies inside a room", () => {
    expect(canvas.furniture.map(({ item: id, at, rotation }) => [id, at, rotation])).toEqual([
      [item.id, [500, 400], 0],
      [item.id, [200, 200], 0],
    ]);
  });

  test("a sketch without walls is rejected by the schema", () => {
    expect(sketchSchema.safeParse({ doors: [] }).success).toBe(false);
  });
});
