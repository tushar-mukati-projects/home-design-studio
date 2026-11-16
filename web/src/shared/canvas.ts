import { z } from "zod";

const CANVAS_VERSION = 1;
const CANVAS_UNITS = "mm";
const COLLAB_DOCUMENT_PREFIX = "design:";
export const CANVAS_COLLECTIONS = ["walls", "openings", "rooms", "furniture"] as const;
export const COLLAB_META_KEY = "meta";

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

export const OPENING_KINDS = ["door", "window"] as const;
export const DOOR_VARIANTS = ["single", "double", "sliding"] as const;
const DOOR_HINGES = ["left", "right"] as const;
const DOOR_SWINGS = ["in", "out"] as const;

export const PLAN_NAMES = ["free", "pro"] as const;
export const SHARE_PERMISSIONS = ["readonly", "readwrite"] as const;
export const DESIGN_PERMISSIONS = ["owner", "readwrite", "readonly"] as const;

export const IMPORT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const IMPORT_IMAGE_MAX_BYTES = 20 * 1024 * 1024;

export const CHAT_MAX_MESSAGES = 30;
export const CHAT_MAX_TOTAL_CHARS = 20_000;
export const CHAT_MESSAGE_MAX_CHARS = 10_000;
export const DESIGN_NAME_MAX_CHARS = 255;

type PlanConfig = { designLimit: number; canShare: boolean; canUseAI: boolean };

export const PLANS = {
  free: { designLimit: 3, canShare: false, canUseAI: false },
  pro: { designLimit: Infinity, canShare: true, canUseAI: true },
} satisfies Record<PlanName, PlanConfig>;

export const DEFAULTS = {
  wallThickness: 120,
  wallHeight: 2700,
  door: { width: 900, height: 2100 },
  window: { width: 1200, height: 1200, sill: 900 },
} as const;

const id = z.string().min(1);
const mm = z.number().int();
const length = mm.positive();
const point = z.tuple([mm, mm]);
const size = z.tuple([length, length, length]);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const designNameSchema = z.string().min(1).max(DESIGN_NAME_MAX_CHARS);

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
  kind: z.enum(OPENING_KINDS),
  wall: id,
  offset: mm.nonnegative(),
  width: length,
  height: length,
  sill: mm.nonnegative().optional(),
  variant: z.enum(DOOR_VARIANTS).optional(),
  hinge: z.enum(DOOR_HINGES).optional(),
  swing: z.enum(DOOR_SWINGS).optional(),
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
  size: size.optional(),
  color: hexColor.optional(),
});

export const canvasSchema = z.object({
  version: z.literal(CANVAS_VERSION),
  units: z.literal(CANVAS_UNITS),
  walls: z.array(wallSchema),
  openings: z.array(openingSchema),
  rooms: z.array(roomSchema),
  furniture: z.array(furnitureSchema),
});

export const catalogItemSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  name: z.string().min(1),
  category: z.enum(FURNITURE_CATEGORIES),
  size,
  color: hexColor,
});

export type Vec2 = z.infer<typeof point>;
export type Size3 = z.infer<typeof size>;
export type Wall = z.infer<typeof wallSchema>;
export type Opening = z.infer<typeof openingSchema>;
export type Room = z.infer<typeof roomSchema>;
export type Furniture = z.infer<typeof furnitureSchema>;
export type Canvas = z.infer<typeof canvasSchema>;
export type CatalogItem = z.infer<typeof catalogItemSchema>;
export type CanvasCollection = (typeof CANVAS_COLLECTIONS)[number];
export type RoomUsage = (typeof ROOM_USAGES)[number];
export type FurnitureCategory = (typeof FURNITURE_CATEGORIES)[number];
export type OpeningKind = (typeof OPENING_KINDS)[number];
export type DoorVariant = (typeof DOOR_VARIANTS)[number];
export type PlanName = (typeof PLAN_NAMES)[number];
export type SharePermission = (typeof SHARE_PERMISSIONS)[number];
export type DesignPermission = (typeof DESIGN_PERMISSIONS)[number];

export const collabDocumentName = (designId: string): string =>
  `${COLLAB_DOCUMENT_PREFIX}${designId}`;

export const designIdFromDocumentName = (documentName: string): string | null =>
  documentName.startsWith(COLLAB_DOCUMENT_PREFIX)
    ? documentName.slice(COLLAB_DOCUMENT_PREFIX.length)
    : null;

export const emptyCanvas = (): Canvas => ({
  version: CANVAS_VERSION,
  units: CANVAS_UNITS,
  walls: [],
  openings: [],
  rooms: [],
  furniture: [],
});

export const newWall = (from: Vec2, to: Vec2): Wall => ({
  id: crypto.randomUUID(),
  from,
  to,
  thickness: DEFAULTS.wallThickness,
  height: DEFAULTS.wallHeight,
});

export const newOpening = (kind: OpeningKind, wallId: string, offset: number): Opening =>
  kind === "door"
    ? {
        id: crypto.randomUUID(),
        kind,
        wall: wallId,
        offset,
        ...DEFAULTS.door,
        variant: "single",
        hinge: "left",
        swing: "in",
      }
    : { id: crypto.randomUUID(), kind, wall: wallId, offset, ...DEFAULTS.window };

export const wallLength = (wall: Pick<Wall, "from" | "to">): number =>
  Math.round(Math.hypot(wall.to[0] - wall.from[0], wall.to[1] - wall.from[1]));

export const polygonArea = (polygon: Vec2[]): number => {
  let sum = 0;
  for (let i = 0; i < polygon.length; i++) {
    const [x1, y1] = polygon[i];
    const [x2, y2] = polygon[(i + 1) % polygon.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};
