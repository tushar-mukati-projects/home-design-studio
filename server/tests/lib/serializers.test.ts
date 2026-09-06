import { describe, test, expect } from "bun:test";
import { serializeDate, serializeDesign, serializeFurnitureItem } from "@/lib/serializers";
import { emptyCanvas } from "@/schemas/canvas.schema";

const furnitureRow = {
  id: "sofa",
  name: "Sofa",
  category: "living_room",
  size: [2000, 900, 850],
  color: "#9ca3af",
};

const canvas = {
  ...emptyCanvas(),
  walls: [{ id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 }],
  rooms: [
    {
      id: "r1",
      name: "Living",
      usage: "living_room",
      polygon: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    },
  ],
  furniture: [{ id: "f1", item: "sofa", at: [500, 500], rotation: 0 }],
};

const design = {
  id: "design-1",
  name: "My Plan",
  description: null,
  thumbnail: null,
  canvasData: canvas,
  userId: "user-1",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
  updatedAt: new Date("2026-02-03T04:05:06.000Z"),
};

describe("serializeDesign", () => {
  test("exposes exactly the intended keys", () => {
    expect(Object.keys(serializeDesign(design as never)).sort()).toEqual(
      [
        "canvasData",
        "createdAt",
        "description",
        "furniture",
        "id",
        "name",
        "rooms",
        "thumbnail",
        "updatedAt",
        "userId",
      ].sort(),
    );
  });

  test("serializes dates as ISO strings", () => {
    const result = serializeDesign(design as never);
    expect(result.createdAt).toBe("2026-01-02T03:04:05.000Z");
    expect(result.updatedAt).toBe("2026-02-03T04:05:06.000Z");
  });

  test("derives rooms and furniture from canvasData", () => {
    const result = serializeDesign(design as never);
    expect(result.rooms).toEqual(canvas.rooms as never);
    expect(result.furniture).toEqual(canvas.furniture as never);
  });

  test("rooms and furniture are always arrays, even for a broken canvas", () => {
    for (const canvasData of [{}, null, { rooms: "nonsense", furniture: 7 }]) {
      const result = serializeDesign({ ...design, canvasData } as never);
      expect(result.rooms).toEqual([]);
      expect(result.furniture).toEqual([]);
    }
  });
});

describe("serializeFurnitureItem", () => {
  test("passes the catalog fields through unchanged", () => {
    expect(serializeFurnitureItem(furnitureRow as never)).toEqual(furnitureRow as never);
  });
});

describe("serializeDate", () => {
  test("formats as ISO 8601", () => {
    expect(serializeDate(new Date("2026-08-27T12:00:00.000Z"))).toBe("2026-08-27T12:00:00.000Z");
  });
});
