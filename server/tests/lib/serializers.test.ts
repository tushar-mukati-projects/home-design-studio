import { describe, test, expect } from "bun:test";
import { serializeDate, serializeDesign, serializeFurnitureItem } from "@/lib/serializers";

const furnitureItem = {
  id: "item-1",
  name: "Sofa",
  category: "living-room",
  width: 200,
  height: 90,
  depth: 85,
  color: "#9ca3af",
  icon: "sofa",
  description: null,
  isDefault: true,
};

const design = {
  id: "design-1",
  name: "My Plan",
  description: null,
  thumbnail: null,
  canvasData: {
    walls: [{ id: "w1" }],
    rooms: [{ id: "r1", name: "Living" }],
    furniture: [{ id: "f1", furnitureItemId: "item-1" }],
  },
  width: 800,
  height: 600,
  userId: "user-1",
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
  updatedAt: new Date("2026-02-03T04:05:06.000Z"),

  yjsState: Buffer.from([1, 2, 3, 4]),
};

describe("serializeDesign", () => {
  test("never leaks yjsState", () => {
    const result = serializeDesign(design as never) as Record<string, unknown>;

    expect(result).not.toHaveProperty("yjsState");
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  test("exposes exactly the intended keys", () => {
    const result = serializeDesign(design as never);

    expect(Object.keys(result).sort()).toEqual(
      [
        "canvasData",
        "createdAt",
        "description",
        "furniture",
        "height",
        "id",
        "name",
        "rooms",
        "thumbnail",
        "updatedAt",
        "userId",
        "width",
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

    expect(result.rooms).toEqual([{ id: "r1", name: "Living" }]);
    expect(result.furniture).toEqual([{ id: "f1", furnitureItemId: "item-1" }]);
  });

  test("rooms and furniture are always arrays, never undefined", () => {
    for (const canvasData of [{}, null, { rooms: "nonsense", furniture: 7 }]) {
      const result = serializeDesign({ ...design, canvasData } as never);
      expect(Array.isArray(result.rooms)).toBe(true);
      expect(Array.isArray(result.furniture)).toBe(true);
      expect(result.rooms).toHaveLength(0);
      expect(result.furniture).toHaveLength(0);
    }
  });

  test("keeps canvasData and the derived views in step", () => {
    const result = serializeDesign(design as never);
    const canvas = result.canvasData as { rooms: unknown[]; furniture: unknown[] };

    expect(result.rooms).toEqual(canvas.rooms as Record<string, unknown>[]);
    expect(result.furniture).toEqual(canvas.furniture as Record<string, unknown>[]);
  });
});

describe("serializeFurnitureItem", () => {
  test("round-trips the catalog fields the editor relies on", () => {
    expect(serializeFurnitureItem(furnitureItem as never)).toEqual(furnitureItem);
  });
});

describe("serializeDate", () => {
  test("formats as ISO 8601", () => {
    expect(serializeDate(new Date("2026-08-27T12:00:00.000Z"))).toBe("2026-08-27T12:00:00.000Z");
  });
});
