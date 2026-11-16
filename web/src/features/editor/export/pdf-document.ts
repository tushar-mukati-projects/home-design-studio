import jsPDF from "jspdf";
import { ROOM_USAGE_COLORS, furnitureName } from "@/lib/canvas";
import { DEFAULT_DESIGN_NAME, formatArea, formatLength } from "@/lib/constants";
import {
  polygonArea,
  wallLength,
  type CatalogItem,
  type Furniture,
  type Room,
  type Wall,
} from "@/shared/canvas";
import type { Capture } from "./capture";
import {
  FURNITURE_COLUMNS,
  FURNITURE_ROW_MM,
  PDF_HEADER_MM,
  PDF_MARGIN_MM,
  ROOM_COLUMNS,
  ROOM_ROW_MM,
  footerReserveMm,
  imageAreaHeightMm,
  pageSize,
  placeImage,
} from "./pdf-layout";
import type { PdfExportOptions } from "./pdf-layout";

type PdfData = {
  designName: string;
  rooms: Room[];
  furniture: Furniture[];
  walls: Wall[];
  catalog: CatalogItem[];
};

type Page = {
  doc: jsPDF;
  width: number;
  height: number;
  contentWidth: number;
  cursorY: number;
};

type Rgb = [number, number, number];

const FOOTER_TEXT = "Created with Home Design Studio";
const TITLE_PT = 18;
const META_PT = 9;
const HEADING_PT = 10;
const BODY_PT = 8;
const FOOTER_PT = 7;
const BLACK_RGB: Rgb = [0, 0, 0];
const MUTED_RGB: Rgb = [120, 120, 120];
const FRAME_RGB: Rgb = [200, 200, 200];
const FOOTER_RGB: Rgb = [150, 150, 150];
const HEADER_BASELINE_MM = 5;
const SECTION_GAP_MM = 8;
const HEADING_SPACE_MM = 12;
const HEADING_HEIGHT_MM = 5;
const DIMENSIONS_ROW_MM = 7;
const LIST_GAP_MM = 3;
const SWATCH_MM = 4;
const SWATCH_RISE_MM = 3;
const SWATCH_GAP_MM = 2;
const BOTTOM_PAD_MM = 6;
const FOOTER_BASELINE_MM = 8;

export const buildPdf = (capture: Capture, options: PdfExportOptions, data: PdfData): jsPDF => {
  const { width, height } = pageSize(options.paperSize, options.orientation);
  const doc = new jsPDF({
    orientation: options.orientation,
    unit: "mm",
    format: options.paperSize,
  });
  const contentWidth = width - PDF_MARGIN_MM * 2;
  const date = formatDate();
  drawHeader(doc, data.designName, date, width);

  const reserve = footerReserveMm(options, {
    rooms: data.rooms.length,
    furniture: data.furniture.length,
    walls: data.walls.length,
  });
  const image = placeImage({
    contentWidth,
    availableHeight: imageAreaHeightMm(height, reserve),
    imgWidth: capture.width,
    imgHeight: capture.height,
  });
  const imgX = PDF_MARGIN_MM + image.offsetX;
  const imgY = PDF_MARGIN_MM + PDF_HEADER_MM;
  doc.addImage(capture.dataUrl, "PNG", imgX, imgY, image.width, image.height);
  doc.setDrawColor(...FRAME_RGB);
  doc.rect(imgX, imgY, image.width, image.height);

  const page: Page = {
    doc,
    width,
    height,
    contentWidth,
    cursorY: imgY + image.height + SECTION_GAP_MM,
  };
  if (options.includeDimensions && data.walls.length > 0)
    drawDimensions(page, data.walls, data.rooms.length);
  if (options.includeRoomLabels && data.rooms.length > 0) drawRooms(page, data.rooms);
  if (options.includeFurnitureList && data.furniture.length > 0)
    drawFurniture(page, data.furniture, data.catalog);
  drawPageFooters(page, date);
  return doc;
};

const drawHeader = (doc: jsPDF, designName: string, date: string, pageWidth: number) => {
  const baseline = PDF_MARGIN_MM + HEADER_BASELINE_MM;
  doc.setFontSize(TITLE_PT);
  doc.setFont("helvetica", "bold");
  doc.text(designName || DEFAULT_DESIGN_NAME, PDF_MARGIN_MM, baseline);
  doc.setFontSize(META_PT);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...MUTED_RGB);
  doc.text(date, pageWidth - PDF_MARGIN_MM, baseline, { align: "right" });
  doc.setTextColor(...BLACK_RGB);
};

const ensureSpace = (page: Page, needed: number) => {
  if (page.cursorY + needed > page.height - PDF_MARGIN_MM - BOTTOM_PAD_MM) {
    page.doc.addPage();
    page.cursorY = PDF_MARGIN_MM;
  }
};

const sectionHeading = (page: Page, title: string) => {
  ensureSpace(page, HEADING_SPACE_MM);
  page.doc.setFontSize(HEADING_PT);
  page.doc.setFont("helvetica", "bold");
  page.doc.text(title, PDF_MARGIN_MM, page.cursorY);
  page.cursorY += HEADING_HEIGHT_MM;
  page.doc.setFontSize(BODY_PT);
  page.doc.setFont("helvetica", "normal");
};

const gridList = <T>(
  page: Page,
  items: T[],
  columns: number,
  rowHeight: number,
  draw: (item: T, x: number, y: number) => void,
) => {
  const colWidth = page.contentWidth / columns;
  for (let i = 0; i < items.length; i += columns) {
    ensureSpace(page, rowHeight);
    items
      .slice(i, i + columns)
      .forEach((item, col) => draw(item, PDF_MARGIN_MM + col * colWidth, page.cursorY));
    page.cursorY += rowHeight;
  }
  page.cursorY += LIST_GAP_MM;
};

const drawDimensions = (page: Page, walls: Wall[], roomCount: number) => {
  sectionHeading(page, "Dimensions");
  const total = walls.reduce((sum, wall) => sum + wallLength(wall), 0);
  page.doc.text(
    `${walls.length} walls | Total length: ${formatLength(total)} | ${roomCount} rooms`,
    PDF_MARGIN_MM,
    page.cursorY,
  );
  page.cursorY += DIMENSIONS_ROW_MM;
};

const drawRooms = (page: Page, rooms: Room[]) => {
  sectionHeading(page, "Rooms");
  gridList(page, rooms, ROOM_COLUMNS, ROOM_ROW_MM, (room, x, y) => {
    page.doc.setFillColor(...hexToRgb(ROOM_USAGE_COLORS[room.usage]));
    page.doc.rect(x, y - SWATCH_RISE_MM, SWATCH_MM, SWATCH_MM, "F");
    page.doc.text(
      `${room.name} (${formatArea(polygonArea(room.polygon))})`,
      x + SWATCH_MM + SWATCH_GAP_MM,
      y,
    );
  });
};

const drawFurniture = (page: Page, furniture: Furniture[], catalog: CatalogItem[]) => {
  sectionHeading(page, "Furniture");
  gridList(page, furniture, FURNITURE_COLUMNS, FURNITURE_ROW_MM, (piece, x, y) => {
    page.doc.text(`• ${furnitureName(piece, catalog)}`, x, y);
  });
};

const drawPageFooters = (page: Page, date: string) => {
  const total = page.doc.getNumberOfPages();
  for (let n = 1; n <= total; n += 1) {
    page.doc.setPage(n);
    page.doc.setFontSize(FOOTER_PT);
    page.doc.setTextColor(...FOOTER_RGB);
    const pages = total > 1 ? ` | Page ${n} of ${total}` : "";
    page.doc.text(
      `${FOOTER_TEXT} | ${date}${pages}`,
      page.width / 2,
      page.height - FOOTER_BASELINE_MM,
      {
        align: "center",
      },
    );
  }
};

const hexToRgb = (hex: string): Rgb => {
  const value = parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const formatDate = (): string =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(),
  );
