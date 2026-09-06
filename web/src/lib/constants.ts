// The drawing is stored in millimetres; this is only how big a millimetre is on screen
// at zoom 1. A 6 m wall renders as 600 px.
export const PX_PER_MM = 0.1;

export const GRID_MM = 200;

export const mmToPx = (mm: number): number => mm * PX_PER_MM;
export const pxToMm = (px: number): number => px / PX_PER_MM;

export const formatLength = (mm: number): string => `${(mm / 1000).toFixed(2)} m`;
export const formatArea = (mm2: number): string => `${(mm2 / 1_000_000).toFixed(1)} m²`;

export const EXPORT_HIDDEN_LAYER_NAME = "export-hidden";
