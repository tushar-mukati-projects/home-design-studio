import { z } from "zod";

// The floor plan format. Every length is an integer millimetre, every coordinate an
// [x, y] pair, every reference the bare id of what it points at.

const id = z.string().min(1);
const mm = z.number().int();
const length = mm.positive();
const point = z.tuple([mm, mm]);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const ROOM_USAGES = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining",
  "office",
  "hallway",
  "closet",
  "garage",
  "laundry",
  "generic",
] as const;

export const FURNITURE_CATEGORIES = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "office",
] as const;

export const DEFAULTS = {
  wallThickness: 120,
  wallHeight: 2700,
  door: { width: 900, height: 2100 },
  window: { width: 1200, height: 1200, sill: 900 },
} as const;

export const wallSchema = z.object({
  id,
  from: point,
  to: point,
  thickness: length,
  height: length,
  color: hexColor.optional(),
});

export const openingSchema = z.object({
  id,
  kind: z.enum(["door", "window"]),
  wall: id,
  offset: mm.nonnegative(),
  width: length,
  height: length,
  sill: mm.nonnegative().optional(),
  variant: z.enum(["single", "double", "sliding"]).optional(),
  hinge: z.enum(["left", "right"]).optional(),
  swing: z.enum(["in", "out"]).optional(),
});

export const roomSchema = z.object({
  id,
  name: z.string().min(1),
  usage: z.enum(ROOM_USAGES),
  polygon: z.array(point).min(3),
});

export const furnitureSchema = z.object({
  id,
  item: id,
  at: point,
  rotation: z.number(),
  size: z.tuple([length, length, length]).optional(),
  color: hexColor.optional(),
});

export const canvasSchema = z.object({
  version: z.literal(1),
  units: z.literal("mm"),
  walls: z.array(wallSchema),
  openings: z.array(openingSchema),
  rooms: z.array(roomSchema),
  furniture: z.array(furnitureSchema),
});

export const catalogItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  category: z.enum(FURNITURE_CATEGORIES),
  size: z.tuple([length, length, length]),
  color: hexColor,
});

export type Wall = z.infer<typeof wallSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Furniture = z.infer<typeof furnitureSchema>;
export type Canvas = z.infer<typeof canvasSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type RoomUsage = (typeof ROOM_USAGES)[number];

export const CANVAS_COLLECTIONS = ["walls", "openings", "rooms", "furniture"] as const;
export type CanvasCollection = (typeof CANVAS_COLLECTIONS)[number];

export const emptyCanvas = (): Canvas => ({
  version: 1,
  units: "mm",
  walls: [],
  openings: [],
  rooms: [],
  furniture: [],
});

export const wallLength = (wall: Pick<Wall, "from" | "to">): number =>
  Math.round(Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]));

export const polygonArea = (polygon: [number, number][]): number => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i]!;
    const [x2, y2] = polygon[(i + 1) % polygon.length]!;
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};
