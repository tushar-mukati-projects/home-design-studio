import { describe, test, expect } from "bun:test";
import {
  canvasSchema,
  catalogItemSchema,
  emptyCanvas,
  polygonArea,
  wallLength,
  CANVAS_COLLECTIONS,
} from "@/schemas/canvas.schema";
import { DEFAULT_TEMPLATES } from "@/lib/seed-data/templates";
import { FURNITURE_CATALOG } from "@/lib/seed-data/furniture";

const wall = { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };

describe("canvasSchema", () => {
  test("an empty canvas is valid", () => {
    expect(canvasSchema.safeParse(emptyCanvas()).success).toBe(true);
  });

  test("every seed template is valid", () => {
    for (const t of DEFAULT_TEMPLATES) {
      const result = canvasSchema.safeParse(t.canvasData);
      expect(result.success, t.name).toBe(true);
    }
  });

  test("every collection key exists on an empty canvas", () => {
    const canvas = emptyCanvas();
    for (const key of CANVAS_COLLECTIONS) expect(canvas[key]).toEqual([]);
  });

  test("lengths must be whole millimetres", () => {
    const canvas = { ...emptyCanvas(), walls: [{ ...wall, thickness: 120.5 }] };
    expect(canvasSchema.safeParse(canvas).success).toBe(false);
  });

  test("the version and units headers are required", () => {
    const { version: _v, ...noVersion } = emptyCanvas();
    expect(canvasSchema.safeParse(noVersion).success).toBe(false);
    expect(canvasSchema.safeParse({ ...emptyCanvas(), units: "px" }).success).toBe(false);
  });

  test("a room needs a known usage and at least three points", () => {
    const room = {
      id: "r1",
      name: "X",
      usage: "living_room",
      polygon: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    };
    expect(canvasSchema.safeParse({ ...emptyCanvas(), rooms: [room] }).success).toBe(true);
    expect(
      canvasSchema.safeParse({ ...emptyCanvas(), rooms: [{ ...room, usage: "attic" }] }).success,
    ).toBe(false);
    expect(
      canvasSchema.safeParse({
        ...emptyCanvas(),
        rooms: [
          {
            ...room,
            polygon: [
              [0, 0],
              [1, 1],
            ],
          },
        ],
      }).success,
    ).toBe(false);
  });

  test("an opening is a door or a window, nothing else", () => {
    const opening = { id: "o1", kind: "door", wall: "w1", offset: 500, width: 900, height: 2100 };
    expect(canvasSchema.safeParse({ ...emptyCanvas(), openings: [opening] }).success).toBe(true);
    expect(
      canvasSchema.safeParse({ ...emptyCanvas(), openings: [{ ...opening, kind: "hatch" }] })
        .success,
    ).toBe(false);
  });

  test("furniture size, when given, is a [width, depth, height] triple", () => {
    const f = { id: "f1", item: "sofa", at: [100, 100], rotation: 0 };
    expect(canvasSchema.safeParse({ ...emptyCanvas(), furniture: [f] }).success).toBe(true);
    expect(
      canvasSchema.safeParse({ ...emptyCanvas(), furniture: [{ ...f, size: [2000, 900] }] })
        .success,
    ).toBe(false);
  });
});

describe("template furniture references the catalog", () => {
  test("every placed item id exists in the catalog", () => {
    const ids = new Set(FURNITURE_CATALOG.map((i) => i.id));
    for (const t of DEFAULT_TEMPLATES) {
      for (const f of t.canvasData.furniture)
        expect(ids.has(f.item), `${t.name}: ${f.item}`).toBe(true);
    }
  });

  test("every opening sits on a wall that exists in the same template", () => {
    for (const t of DEFAULT_TEMPLATES) {
      const walls = new Set(t.canvasData.walls.map((w) => w.id));
      for (const o of t.canvasData.openings)
        expect(walls.has(o.wall), `${t.name}: ${o.id}`).toBe(true);
    }
  });
});

describe("catalog", () => {
  test("every item is valid", () => {
    for (const item of FURNITURE_CATALOG) {
      expect(catalogItemSchema.safeParse(item).success, item.id).toBe(true);
    }
  });

  test("ids are unique slugs", () => {
    const ids = FURNITURE_CATALOG.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("a sofa is wider than it is deep, and lower than it is wide", () => {
    const sofa = FURNITURE_CATALOG.find((i) => i.id === "sofa")!;
    const [width, depth, height] = sofa.size;
    expect(width).toBeGreaterThan(depth);
    expect(height).toBeLessThan(width);
  });
});

describe("geometry helpers", () => {
  test("wallLength is the euclidean distance in whole mm", () => {
    expect(wallLength({ from: [0, 0], to: [3000, 4000] })).toBe(5000);
  });

  test("polygonArea of a 4×3 m room is 12 m²", () => {
    const area = polygonArea([
      [0, 0],
      [4000, 0],
      [4000, 3000],
      [0, 3000],
    ]);
    expect(area).toBe(12_000_000);
  });
});
