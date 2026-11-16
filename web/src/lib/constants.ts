import type { Size3, Vec2 } from "@/shared/canvas";

export const PX_PER_MM = 0.1;
export const M_PER_MM = 0.001;
export const GRID_MM = 200;

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5;
export const ZOOM_STEP = 1.2;
export const FIT_MAX_ZOOM = 1.5;
export const FIT_MARGIN_MM = 1000;
export const FIT_PADDING_PX = 80;

export const PICK_THRESHOLD_PX = 20;
export const SNAP_THRESHOLD_PX = 12;
export const MIN_WALL_LENGTH_MM = 50;
export const NUDGE_MM = 50;
export const ANGLE_STEP_DEG = 45;

export const OPENING_WIDTH_MIN_MM = 300;
export const OPENING_WIDTH_MAX_MM = 3000;

export const DEFAULT_FURNITURE_SIZE: Size3 = [600, 600, 600];
export const DEFAULT_FURNITURE_COLOR = "#d4d4d8";
export const MIN_FURNITURE_SIDE_MM = 100;
export const QUICK_ADD_AT: Vec2 = [3000, 2000];

export const COPY_FEEDBACK_MS = 2000;

export const DEFAULT_DESIGN_NAME = "Untitled design";

export const EXPORT_HIDDEN_LAYER_NAME = "export-hidden";

export const CATALOG_ITEM_DRAG_TYPE = "application/x-catalog-item";

export const clampZoom = (zoom: number): number => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

export const metres = (mm: number, digits: number): string => (mm * M_PER_MM).toFixed(digits);
export const formatLength = (mm: number): string => `${metres(mm, 2)} m`;
export const formatArea = (mm2: number): string => `${(mm2 / 1_000_000).toFixed(1)} m²`;
