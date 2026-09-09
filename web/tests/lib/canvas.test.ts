import { describe, test, expect } from "bun:test";
import {
  boundsOf,
  centroid,
  constrainAngle,
  snapToEndpoints,
  wallJunctions,
  clampOpeningOffset,
  distanceToWall,
  emptyCanvas,
  furnitureSize,
  offsetAlongWall,
  pointOnWall,
  polygonArea,
  rectPolygon,
  wallLength,
} from "@/lib/canvas";
import type { CatalogItem, Wall } from "@/types";

const wall: Wall = { id: "w", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };
const catalog: CatalogItem[] = [
  { id: "sofa", name: "Sofa", category: "living_room", size: [2000, 900, 850], color: "#9ca3af" },
];

describe("walls", () => {
  test("length is euclidean", () => {
    expect(wallLength({ from: [0, 0], to: [3000, 4000] })).toBe(5000);
  });

  test("pointOnWall walks from the `from` end", () => {
    expect(pointOnWall(wall, 1000)).toEqual([1000, 0]);
    expect(pointOnWall({ from: [4000, 0], to: [0, 0] }, 1000)).toEqual([3000, 0]);
  });

  test("offsetAlongWall projects and clamps to the segment", () => {
    expect(offsetAlongWall(wall, 1500, 300)).toBe(1500);
    expect(offsetAlongWall(wall, -500, 0)).toBe(0);
    expect(offsetAlongWall(wall, 9000, 0)).toBe(4000);
  });

  test("distanceToWall is the perpendicular distance inside the segment", () => {
    expect(distanceToWall(wall, 2000, 250)).toBe(250);
    expect(distanceToWall(wall, 5000, 0)).toBe(1000);
  });

  test("an opening cannot hang off either end of its wall", () => {
    expect(clampOpeningOffset({ width: 900 }, wall, 0)).toBe(450);
    expect(clampOpeningOffset({ width: 900 }, wall, 4000)).toBe(3550);
    expect(clampOpeningOffset({ width: 900 }, wall, 2000)).toBe(2000);
  });
});

describe("polygons", () => {
  test("a 4×3 m rectangle is 12 m²", () => {
    expect(polygonArea(rectPolygon(0, 0, 4000, 3000))).toBe(12_000_000);
  });

  test("winding direction does not change the area", () => {
    const cw = rectPolygon(0, 0, 4000, 3000);
    expect(polygonArea([...cw].reverse())).toBe(polygonArea(cw));
  });

  test("centroid of a rectangle is its middle", () => {
    expect(centroid(rectPolygon(1000, 1000, 2000, 2000))).toEqual([2000, 2000]);
  });
});

describe("furniture", () => {
  test("a placement's own size wins over the catalog", () => {
    const piece = { id: "f", item: "sofa", at: [0, 0] as [number, number], rotation: 0 };
    expect(furnitureSize(piece, catalog)).toEqual([2000, 900, 850]);
    expect(furnitureSize({ ...piece, size: [1500, 800, 850] }, catalog)).toEqual([1500, 800, 850]);
  });

  test("an unknown item still has a size, so nothing crashes", () => {
    expect(furnitureSize({ id: "f", item: "ghost", at: [0, 0], rotation: 0 }, catalog)).toEqual([
      600, 600, 600,
    ]);
  });
});

describe("bounds", () => {
  test("an empty canvas has no bounds", () => {
    expect(boundsOf(emptyCanvas())).toBeNull();
  });

  test("bounds cover walls, rooms and furniture", () => {
    const canvas = {
      ...emptyCanvas(),
      walls: [wall],
      rooms: [
        { id: "r", name: "R", usage: "generic" as const, polygon: rectPolygon(0, 0, 1000, 6000) },
      ],
      furniture: [{ id: "f", item: "sofa", at: [-500, 100] as [number, number], rotation: 0 }],
    };
    expect(boundsOf(canvas)).toEqual({ minX: -500, minY: 0, maxX: 4000, maxY: 6000 });
  });
});

describe("drawing aids", () => {
  const other: Wall = { id: "o", from: [4000, 0], to: [4000, 3000], thickness: 120, height: 2700 };

  test("snapToEndpoints picks the closest endpoint inside the threshold", () => {
    expect(snapToEndpoints({ x: 3950, y: 40 }, [wall, other], 100)).toEqual([4000, 0]);
    expect(snapToEndpoints({ x: 2000, y: 500 }, [wall, other], 100)).toBeNull();
  });

  test("snapToEndpoints ignores the wall being edited", () => {
    expect(snapToEndpoints({ x: 10, y: 10 }, [wall], 100, "w")).toBeNull();
  });

  test("constrainAngle rounds to 45° and keeps the length", () => {
    const to = constrainAngle({ x: 0, y: 0 }, { x: 1000, y: 100 });
    expect(to).toEqual({ x: 1005, y: 0 });
    const diag = constrainAngle({ x: 0, y: 0 }, { x: 1000, y: 900 });
    expect(Math.abs(diag.x - diag.y)).toBeLessThanOrEqual(1);
  });

  test("wallJunctions lists only shared endpoints, once each", () => {
    const junctions = wallJunctions([wall, other]);
    expect(junctions).toEqual([{ at: [4000, 0], thickness: 120 }]);
    expect(wallJunctions([wall])).toEqual([]);
  });
});
