import type {
  Canvas,
  CatalogItem,
  Furniture,
  Opening,
  Point,
  RoomUsage,
  Size3,
  Vec2,
  Wall,
} from "@/types";

export const DEFAULTS = {
  wallThickness: 120,
  wallHeight: 2700,
  door: { width: 900, height: 2100 },
  window: { width: 1200, height: 1200, sill: 900 },
} as const;

export const ROOM_USAGE_LABELS: Record<RoomUsage, string> = {
  living_room: "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  dining: "Dining Room",
  office: "Office",
  hallway: "Hallway",
  closet: "Closet",
  garage: "Garage",
  laundry: "Laundry",
  generic: "Generic",
};

export const ROOM_USAGE_COLORS: Record<RoomUsage, string> = {
  living_room: "#2c2c2e",
  bedroom: "#6B5B95",
  kitchen: "#C45645",
  bathroom: "#4A7FB5",
  dining: "#D48620",
  office: "#2EA85A",
  hallway: "#71717a",
  closet: "#a1a1aa",
  garage: "#787880",
  laundry: "#5b8a95",
  generic: "#8a8a94",
};

export const emptyCanvas = (): Canvas => ({
  version: 1,
  units: "mm",
  walls: [],
  openings: [],
  rooms: [],
  furniture: [],
});

export const newId = (): string => crypto.randomUUID();

export const wallLength = (wall: Pick<Wall, "from" | "to">): number =>
  Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]);

export const wallAngle = (wall: Pick<Wall, "from" | "to">): number =>
  Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);

export const pointOnWall = (wall: Pick<Wall, "from" | "to">, offset: number): Vec2 => {
  const len = wallLength(wall) || 1;
  const t = offset / len;
  return [
    wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    wall.from[1] + (wall.to[1] - wall.from[1]) * t,
  ];
};

// Distance along the wall from its `from` end to the projection of (x, y).
export const offsetAlongWall = (wall: Pick<Wall, "from" | "to">, x: number, y: number): number => {
  const dx = wall.to[0] - wall.from[0];
  const dy = wall.to[1] - wall.from[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0;
  const t = ((x - wall.from[0]) * dx + (y - wall.from[1]) * dy) / lenSq;
  return Math.max(0, Math.min(1, t)) * Math.sqrt(lenSq);
};

export const distanceToWall = (wall: Pick<Wall, "from" | "to">, x: number, y: number): number => {
  const [px, py] = pointOnWall(wall, offsetAlongWall(wall, x, y));
  return Math.hypot(x - px, y - py);
};

export const clampOpeningOffset = (opening: Pick<Opening, "width">, wall: Wall, offset: number) => {
  const half = opening.width / 2;
  const len = wallLength(wall);
  return Math.round(Math.max(half, Math.min(len - half, offset)));
};

export const polygonArea = (polygon: Vec2[]): number => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};

export const centroid = (polygon: Vec2[]): Vec2 => {
  if (polygon.length === 0) return [0, 0];
  const sx = polygon.reduce((s, p) => s + p[0], 0);
  const sy = polygon.reduce((s, p) => s + p[1], 0);
  return [sx / polygon.length, sy / polygon.length];
};

export const rectPolygon = (x: number, y: number, w: number, h: number): Vec2[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

// A placement's own size wins; otherwise the catalog's. Unknown items get a 600 mm cube.
export const furnitureSize = (piece: Furniture, catalog: CatalogItem[]): Size3 =>
  piece.size ?? catalog.find((c) => c.id === piece.item)?.size ?? [600, 600, 600];

export const furnitureColor = (piece: Furniture, catalog: CatalogItem[]): string =>
  piece.color ?? catalog.find((c) => c.id === piece.item)?.color ?? "#d4d4d8";

export const furnitureName = (piece: Furniture, catalog: CatalogItem[]): string =>
  catalog.find((c) => c.id === piece.item)?.name ?? piece.item;

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export const boundsOf = (canvas: Pick<Canvas, "walls" | "rooms" | "furniture">): Bounds | null => {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const w of canvas.walls) {
    xs.push(w.from[0], w.to[0]);
    ys.push(w.from[1], w.to[1]);
  }
  for (const r of canvas.rooms) {
    for (const [x, y] of r.polygon) {
      xs.push(x);
      ys.push(y);
    }
  }
  for (const f of canvas.furniture) {
    xs.push(f.at[0]);
    ys.push(f.at[1]);
  }
  if (xs.length === 0) return null;
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
};

export const toPoint = (v: Vec2): Point => ({ x: v[0], y: v[1] });
export const toVec = (p: Point): Vec2 => [Math.round(p.x), Math.round(p.y)];
