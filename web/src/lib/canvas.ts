import {
  ANGLE_STEP_DEG,
  DEFAULT_FURNITURE_COLOR,
  DEFAULT_FURNITURE_SIZE,
  FIT_MARGIN_MM,
  FIT_MAX_ZOOM,
  FIT_PADDING_PX,
  MIN_ZOOM,
  PX_PER_MM,
} from "@/lib/constants";
import {
  wallLength,
  type Canvas,
  type CatalogItem,
  type Furniture,
  type Opening,
  type RoomUsage,
  type Size3,
  type Vec2,
  type Wall,
} from "@/shared/canvas";
import type { Point } from "@/types";

export type View = {
  zoom: number;
  panX: number;
  panY: number;
};

export type RectSize = {
  width: number;
  height: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type Endpoint = {
  p: Vec2;
  d: number;
};

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

export const newId = (): string => crypto.randomUUID();

export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;

export const wallAngle = (wall: Pick<Wall, "from" | "to">): number =>
  Math.atan2(wall.to[1] - wall.from[1], wall.to[0] - wall.from[0]);

export const labelNormal = (angle: number): number =>
  Math.sin(angle) >= 0 && Math.cos(angle) > 0 ? angle - Math.PI / 2 : angle + Math.PI / 2;

export const pointOnWall = (wall: Pick<Wall, "from" | "to">, offset: number): Vec2 => {
  const len = wallLength(wall) || 1;
  const t = offset / len;
  return [
    wall.from[0] + (wall.to[0] - wall.from[0]) * t,
    wall.from[1] + (wall.to[1] - wall.from[1]) * t,
  ];
};

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

export const clampOpeningOffset = (
  opening: Pick<Opening, "width">,
  wall: Pick<Wall, "from" | "to">,
  offset: number,
): number => {
  const len = wallLength(wall);
  if (len <= opening.width) return Math.round(len / 2);
  const half = opening.width / 2;
  return Math.round(Math.max(half, Math.min(len - half, offset)));
};

export const nearestWall = (
  x: number,
  y: number,
  walls: Wall[],
  threshold: number,
): Wall | null => {
  let best: { wall: Wall; dist: number } | null = null;
  for (const wall of walls) {
    const dist = distanceToWall(wall, x, y) - wall.thickness / 2;
    if (dist < threshold && (!best || dist < best.dist)) best = { wall, dist };
  }
  return best?.wall ?? null;
};

export const nearestOpening = (
  x: number,
  y: number,
  openings: Opening[],
  walls: Wall[],
  threshold: number,
): Opening | null => {
  const wallMap = new Map(walls.map((w) => [w.id, w]));
  let best: { opening: Opening; dist: number } | null = null;
  for (const opening of openings) {
    const wall = wallMap.get(opening.wall);
    if (!wall) continue;
    const [px, py] = pointOnWall(wall, opening.offset);
    const dist = Math.hypot(x - px, y - py);
    if (dist < threshold && (!best || dist < best.dist)) best = { opening, dist };
  }
  return best?.opening ?? null;
};

export const furnitureAt = (
  x: number,
  y: number,
  furniture: Furniture[],
  catalog: CatalogItem[],
): Furniture | null =>
  furniture.find((piece) => {
    const [w, d] = furnitureSize(piece, catalog);
    const rad = (piece.rotation * Math.PI) / 180;
    const dx = x - piece.at[0];
    const dy = y - piece.at[1];
    const localX = dx * Math.cos(rad) + dy * Math.sin(rad);
    const localY = -dx * Math.sin(rad) + dy * Math.cos(rad);
    return Math.abs(localX) <= w / 2 && Math.abs(localY) <= d / 2;
  }) ?? null;

export const centroid = (polygon: Vec2[]): Vec2 => {
  if (polygon.length === 0) return [0, 0];
  const sx = polygon.reduce((s, p) => s + p[0], 0);
  const sy = polygon.reduce((s, p) => s + p[1], 0);
  return [sx / polygon.length, sy / polygon.length];
};

export const furnitureSize = (piece: Furniture, catalog: CatalogItem[]): Size3 =>
  piece.size ?? catalog.find((c) => c.id === piece.item)?.size ?? DEFAULT_FURNITURE_SIZE;

export const furnitureColor = (piece: Furniture, catalog: CatalogItem[]): string =>
  piece.color ?? catalog.find((c) => c.id === piece.item)?.color ?? DEFAULT_FURNITURE_COLOR;

export const furnitureName = (piece: Furniture, catalog: CatalogItem[]): string =>
  catalog.find((c) => c.id === piece.item)?.name ?? piece.item;

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

export const fitView = (bounds: Bounds | null, rect: RectSize, zoom: number): View => {
  if (!bounds) return { zoom, panX: rect.width / 2, panY: rect.height / 2 };
  const contentW = (bounds.maxX - bounds.minX + FIT_MARGIN_MM * 2) * PX_PER_MM;
  const contentH = (bounds.maxY - bounds.minY + FIT_MARGIN_MM * 2) * PX_PER_MM;
  const fitZoom = Math.max(
    MIN_ZOOM,
    Math.min(
      FIT_MAX_ZOOM,
      (rect.width - FIT_PADDING_PX * 2) / contentW,
      (rect.height - FIT_PADDING_PX * 2) / contentH,
    ),
  );
  const cx = ((bounds.minX + bounds.maxX) / 2) * PX_PER_MM;
  const cy = ((bounds.minY + bounds.maxY) / 2) * PX_PER_MM;
  return {
    zoom: fitZoom,
    panX: rect.width / 2 - cx * fitZoom,
    panY: rect.height / 2 - cy * fitZoom,
  };
};

export const toVec = (p: Point): Vec2 => [Math.round(p.x), Math.round(p.y)];

export const snapToEndpoints = (
  point: Point,
  walls: Wall[],
  threshold: number,
  ignoreWallId?: string,
): Vec2 | null => {
  let best: Endpoint | null = null;
  for (const wall of walls) {
    if (wall.id === ignoreWallId) continue;
    for (const end of [wall.from, wall.to]) {
      const d = Math.hypot(point.x - end[0], point.y - end[1]);
      if (d <= threshold && (!best || d < best.d)) best = { p: end, d };
    }
  }
  return best?.p ?? null;
};

export const constrainAngle = (from: Point, to: Point, lengthStep = 1): Point => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) return to;
  const step = (ANGLE_STEP_DEG * Math.PI) / 180;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  const snapped = Math.round(length / lengthStep) * lengthStep;
  return {
    x: Math.round(from.x + Math.cos(angle) * snapped),
    y: Math.round(from.y + Math.sin(angle) * snapped),
  };
};

export const wallJunctions = (walls: Wall[]): { at: Vec2; thickness: number }[] => {
  const seen = new Map<string, { at: Vec2; thickness: number; count: number }>();
  for (const wall of walls) {
    for (const end of [wall.from, wall.to]) {
      const key = `${end[0]},${end[1]}`;
      const entry = seen.get(key);
      if (entry) {
        entry.count += 1;
        entry.thickness = Math.max(entry.thickness, wall.thickness);
      } else {
        seen.set(key, { at: end, thickness: wall.thickness, count: 1 });
      }
    }
  }
  return [...seen.values()]
    .filter((e) => e.count > 1)
    .map(({ at, thickness }) => ({ at, thickness }));
};
