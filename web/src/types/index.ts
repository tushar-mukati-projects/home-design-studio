export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  color: string;
}

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  type: "single" | "double" | "sliding";
  flipHinge?: boolean;
  flipSwing?: boolean;
}

export interface Window {
  id: string;
  wallId: string;
  position: number;
  width: number;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  color: string;
  points: Point[];
  area: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  depth: number;
  color: string;
  icon?: string;
  description?: string;
}

export interface PlacedFurniture {
  id: string;
  furnitureItemId: string;
  furnitureItem: FurnitureItem;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export type DesignPermission = "owner" | "readwrite" | "readonly";

export interface Design {
  id: string;
  name: string;
  description?: string | null;
  thumbnail?: string | null;
  width: number;
  height: number;
  canvasData: CanvasData;
  rooms: Room[];
  furniture: PlacedFurniture[];
  permission?: DesignPermission;
  createdAt: string;
  updatedAt: string;
}

export interface CanvasData {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms?: Room[];
  furniture?: PlacedFurniture[];
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
}

export type DesignSummary = Omit<Design, "canvasData">;

export interface DesignTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  canvasData: CanvasData;
  width: number;
  height: number;
  sortOrder: number;
}

export type EditorTool = "select" | "wall" | "door" | "window" | "eraser" | "pan";

export interface Point {
  x: number;
  y: number;
}

export type CanvasElement = Wall | PlacedFurniture;

export interface HistoryCommand {
  type: string;
  before: unknown;
  after: unknown;
  timestamp: number;
}
