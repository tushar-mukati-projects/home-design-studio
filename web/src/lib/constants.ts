export const PIXELS_PER_FOOT = 30;

export const pxToFeet = (px: number): number => px / PIXELS_PER_FOOT;
export const feetToPx = (ft: number): number => ft * PIXELS_PER_FOOT;
export const pxToSquareFeet = (areaPx: number): number =>
  areaPx / (PIXELS_PER_FOOT * PIXELS_PER_FOOT);

export const EXPORT_HIDDEN_LAYER_NAME = "export-hidden";
