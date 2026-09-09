export const PX_PER_MM = 0.1;

export const GRID_MM = 200;

export const mmToPx = (mm: number): number => mm * PX_PER_MM;
export const pxToMm = (px: number): number => px / PX_PER_MM;

export const formatLength = (mm: number): string => `${(mm / 1000).toFixed(2)} m`;
export const formatArea = (mm2: number): string => `${(mm2 / 1_000_000).toFixed(1)} m²`;

export const EXPORT_HIDDEN_LAYER_NAME = "export-hidden";
