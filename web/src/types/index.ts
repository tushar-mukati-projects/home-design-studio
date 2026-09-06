// Mirrors server/src/schemas/canvas.schema.ts. Every length is an integer millimetre,
// every coordinate an [x, y] pair, every reference the bare id of what it points at.

export type Vec2 = [number, number];
export type Size3 = [number, number, number];

export interface Wall {
  id: string;
  from: Vec2;
  to: Vec2;
  thickness: number;
  height: number;
  color?: string;
}

export type OpeningKind = "door" | "window";
export type DoorVariant = "single" | "double" | "sliding";

export interface Opening {
  id: string;
  kind: OpeningKind;
  wall: string;
  offset: number;
  width: number;
  height: number;
  sill?: number;
  variant?: DoorVariant;
  hinge?: "left" | "right";
  swing?: "in" | "out";
}

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
export type RoomUsage = (typeof ROOM_USAGES)[number];

export interface Room {
  id: string;
  name: string;
  usage: RoomUsage;
  polygon: Vec2[];
}

export interface Furniture {
  id: string;
  item: string;
  at: Vec2;
  rotation: number;
  size?: Size3;
  color?: string;
}

export interface Canvas {
  version: 1;
  units: "mm";
  walls: Wall[];
  openings: Opening[];
  rooms: Room[];
  furniture: Furniture[];
}

export const FURNITURE_CATEGORIES = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "office",
] as const;
export type FurnitureCategory = (typeof FURNITURE_CATEGORIES)[number];

export interface CatalogItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  size: Size3;
  color: string;
}

export type DesignPermission = "owner" | "readwrite" | "readonly";

export interface Design {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  canvasData: Canvas;
  rooms: Room[];
  furniture: Furniture[];
  permission?: DesignPermission;
  createdAt: string;
  updatedAt: string;
}

export type DesignSummary = Omit<Design, "canvasData">;

export interface DesignListItem extends DesignSummary {
  permission: DesignPermission;
  ownerName: string | null;
  ownerEmail: string | null;
}

export interface DesignTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  canvasData: Canvas;
  sortOrder: number;
}

export type EditorTool = "select" | "wall" | "door" | "window" | "eraser" | "pan";

export interface Point {
  x: number;
  y: number;
}
