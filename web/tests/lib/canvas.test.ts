import { describe, test, expect } from "bun:test";
import {
  boundsOf,
  centroid,
  clampOpeningOffset,
  constrainAngle,
  distanceToWall,
  fitView,
  furnitureAt,
  furnitureSize,
  labelNormal,
  nearestOpening,
  nearestWall,
  offsetAlongWall,
  pointOnWall,
  snapToEndpoints,
  wallJunctions,
} from "@/lib/canvas";
import { FIT_MAX_ZOOM, MIN_ZOOM } from "@/lib/constants";
import {
  emptyCanvas,
  polygonArea,
  wallLength,
  type CatalogItem,
  type Furniture,
  type Opening,
  type Vec2,
  type Wall,
} from "@/shared/canvas";

const wall: Wall = { id: "w", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };
const other: Wall = { id: "o", from: [4000, 0], to: [4000, 3000], thickness: 120, height: 2700 };
const catalog: CatalogItem[] = [
  { id: "sofa", name: "Sofa", category: "living_room", size: [2000, 900, 850], color: "#9ca3af" },
];
const door: Opening = { id: "d", kind: "door", wall: "w", offset: 2000, width: 900, height: 2100 };

const rect = (x: number, y: number, w: number, h: number): Vec2[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
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

  test("labelNormal always points to the same side of the wall", () => {
    expect(labelNormal(0)).toBeCloseTo(-Math.PI / 2);
    expect(labelNormal(Math.PI)).toBeCloseTo(Math.PI * 1.5);
  });
});

describe("openings", () => {
  test("an opening cannot hang off either end of its wall", () => {
    expect(clampOpeningOffset({ width: 900 }, wall, 0)).toBe(450);
    expect(clampOpeningOffset({ width: 900 }, wall, 4000)).toBe(3550);
    expect(clampOpeningOffset({ width: 900 }, wall, 2000)).toBe(2000);
  });

  test("a wall shorter than the opening centres it instead of returning width/2", () => {
    const short: Wall = { ...wall, to: [500, 0] };
    expect(clampOpeningOffset({ width: 900 }, short, 400)).toBe(250);
  });
});

describe("hit tests", () => {
  test("nearestWall picks the closest wall inside the threshold, measured from its face", () => {
    expect(nearestWall(2000, 70, [wall, other], 20)?.id).toBe("w");
    expect(nearestWall(2000, 100, [wall, other], 20)).toBeNull();
    expect(nearestWall(3990, 1500, [wall, other], 20)?.id).toBe("o");
  });

  test("nearestOpening returns the opening nearest to the point", () => {
    expect(nearestOpening(2050, 10, [door], [wall], 100)?.id).toBe("d");
    expect(nearestOpening(500, 10, [door], [wall], 100)).toBeNull();
    expect(nearestOpening(2000, 0, [door], [], 100)).toBeNull();
  });

  test("furnitureAt respects rotation", () => {
    const piece: Furniture = { id: "f", item: "sofa", at: [0, 0], rotation: 90 };
    expect(furnitureAt(0, 900, [piece], catalog)?.id).toBe("f");
    expect(furnitureAt(900, 0, [piece], catalog)).toBeNull();
  });
});

describe("polygons", () => {
  test("a 4×3 m rectangle is 12 m²", () => {
    expect(polygonArea(rect(0, 0, 4000, 3000))).toBe(12_000_000);
  });

  test("winding direction does not change the area", () => {
    const cw = rect(0, 0, 4000, 3000);
    expect(polygonArea([...cw].reverse())).toBe(polygonArea(cw));
  });

  test("centroid of a rectangle is its middle", () => {
    expect(centroid(rect(1000, 1000, 2000, 2000))).toEqual([2000, 2000]);
  });
});

describe("furniture", () => {
  test("a placement's own size wins over the catalog", () => {
    const piece = { id: "f", item: "sofa", at: [0, 0] as Vec2, rotation: 0 };
    expect(furnitureSize(piece, catalog)).toEqual([2000, 900, 850]);
    expect(furnitureSize({ ...piece, size: [1500, 800, 850] }, catalog)).toEqual([1500, 800, 850]);
  });

  test("an unknown item still has a size, so nothing crashes", () => {
    expect(furnitureSize({ id: "f", item: "ghost", at: [0, 0], rotation: 0 }, catalog)).toEqual([
      600, 600, 600,
    ]);
  });
});

describe("bounds and fitting", () => {
  test("an empty canvas has no bounds", () => {
    expect(boundsOf(emptyCanvas())).toBeNull();
  });

  test("bounds cover walls, rooms and furniture", () => {
    const canvas = {
      ...emptyCanvas(),
      walls: [wall],
      rooms: [{ id: "r", name: "R", usage: "generic" as const, polygon: rect(0, 0, 1000, 6000) }],
      furniture: [{ id: "f", item: "sofa", at: [-500, 100] as Vec2, rotation: 0 }],
    };
    expect(boundsOf(canvas)).toEqual({ minX: -500, minY: 0, maxX: 4000, maxY: 6000 });
  });

  test("fitView with no content centres the origin and keeps the zoom", () => {
    expect(fitView(null, { width: 800, height: 600 }, 0.7)).toEqual({
      zoom: 0.7,
      panX: 400,
      panY: 300,
    });
  });

  test("fitView centres the content and fits it inside the padding", () => {
    const view = fitView(
      { minX: 0, minY: 0, maxX: 4000, maxY: 3000 },
      { width: 1000, height: 800 },
      1,
    );
    expect(view.zoom).toBeCloseTo(640 / 500);
    expect(view.panX).toBeCloseTo(500 - 200 * view.zoom);
    expect(view.panY).toBeCloseTo(400 - 150 * view.zoom);
  });

  test.each([
    [{ minX: 0, minY: 0, maxX: 10, maxY: 10 }, FIT_MAX_ZOOM],
    [{ minX: 0, minY: 0, maxX: 900_000, maxY: 10 }, MIN_ZOOM],
  ])("fitView clamps the zoom for %j", (bounds, zoom) => {
    expect(fitView(bounds, { width: 1000, height: 800 }, 1).zoom).toBe(zoom);
  });
});

describe("drawing aids", () => {
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

  test("constrainAngle rounds the length along the direction, not x and y separately", () => {
    expect(constrainAngle({ x: 50, y: 50 }, { x: 1050, y: 60 }, 200)).toEqual({ x: 1050, y: 50 });
    const diag = constrainAngle({ x: 50, y: 50 }, { x: 2050, y: 2250 }, 200);
    expect(diag.x).toBe(diag.y);
    expect(Math.hypot(diag.x - 50, diag.y - 50)).toBeCloseTo(3000, 0);
  });

  test("wallJunctions lists only shared endpoints, once each", () => {
    const junctions = wallJunctions([wall, other]);
    expect(junctions).toEqual([{ at: [4000, 0], thickness: 120 }]);
    expect(wallJunctions([wall])).toEqual([]);
  });
});
