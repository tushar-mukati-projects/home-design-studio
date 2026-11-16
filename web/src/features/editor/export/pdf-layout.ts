export type PaperSize = "a4" | "a3";
export type Orientation = "landscape" | "portrait";
export type Quality = "standard" | "high";

export type PdfExportOptions = {
  paperSize: PaperSize;
  orientation: Orientation;
  includeRoomLabels: boolean;
  includeDimensions: boolean;
  includeFurnitureList: boolean;
  quality: Quality;
};

export type PageSize = {
  width: number;
  height: number;
};

export type ContentCounts = {
  rooms: number;
  furniture: number;
  walls: number;
};

export type ImageFit = {
  contentWidth: number;
  availableHeight: number;
  imgWidth: number;
  imgHeight: number;
};

export type ImagePlacement = {
  width: number;
  height: number;
  offsetX: number;
};

const PAPER_MM: Record<PaperSize, PageSize> = {
  a4: { width: 297, height: 210 },
  a3: { width: 420, height: 297 },
};

export const PDF_MARGIN_MM = 15;
export const PDF_HEADER_MM = 15;
export const PDF_FOOTER_MIN_MM = 12;
const PDF_IMAGE_MIN_SHARE = 0.4;
const SECTION_HEADING_MM = 8;
export const ROOM_COLUMNS = 3;
export const ROOM_ROW_MM = 7;
export const FURNITURE_COLUMNS = 2;
export const FURNITURE_ROW_MM = 6;
const DIMENSIONS_MM = 14;

export const pageSize = (paper: PaperSize, orientation: Orientation): PageSize => {
  const { width, height } = PAPER_MM[paper];
  return orientation === "landscape" ? { width, height } : { width: height, height: width };
};

export const footerReserveMm = (options: PdfExportOptions, counts: ContentCounts): number => {
  let reserve = PDF_FOOTER_MIN_MM;
  if (options.includeRoomLabels && counts.rooms > 0)
    reserve += SECTION_HEADING_MM + Math.ceil(counts.rooms / ROOM_COLUMNS) * ROOM_ROW_MM;
  if (options.includeFurnitureList && counts.furniture > 0)
    reserve +=
      SECTION_HEADING_MM + Math.ceil(counts.furniture / FURNITURE_COLUMNS) * FURNITURE_ROW_MM;
  if (options.includeDimensions && counts.walls > 0) reserve += DIMENSIONS_MM;
  return reserve;
};

export const imageAreaHeightMm = (pageHeight: number, footerReserve: number): number => {
  const maxHeight = pageHeight - PDF_MARGIN_MM * 2 - PDF_HEADER_MM;
  return Math.max(maxHeight * PDF_IMAGE_MIN_SHARE, maxHeight - footerReserve);
};

export const placeImage = ({
  contentWidth,
  availableHeight,
  imgWidth,
  imgHeight,
}: ImageFit): ImagePlacement => {
  const scale = Math.min(contentWidth / imgWidth, availableHeight / imgHeight, 1);
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  return { width, height, offsetX: (contentWidth - width) / 2 };
};
