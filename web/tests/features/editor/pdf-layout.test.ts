import { describe, test, expect } from "bun:test";
import {
  PDF_FOOTER_MIN_MM,
  footerReserveMm,
  pageSize,
  placeImage,
} from "@/features/editor/export/pdf-layout";
import type {
  ContentCounts,
  ImageFit,
  ImagePlacement,
  Orientation,
  PageSize,
  PaperSize,
  PdfExportOptions,
} from "@/features/editor/export/pdf-layout";

const ALL_SECTIONS: PdfExportOptions = {
  paperSize: "a4",
  orientation: "landscape",
  includeRoomLabels: true,
  includeDimensions: true,
  includeFurnitureList: true,
  quality: "standard",
};

const NO_SECTIONS: PdfExportOptions = {
  ...ALL_SECTIONS,
  includeRoomLabels: false,
  includeDimensions: false,
  includeFurnitureList: false,
};

const PAGE_SIZES: [PaperSize, Orientation, PageSize][] = [
  ["a4", "landscape", { width: 297, height: 210 }],
  ["a4", "portrait", { width: 210, height: 297 }],
  ["a3", "landscape", { width: 420, height: 297 }],
  ["a3", "portrait", { width: 297, height: 420 }],
];

const IMAGE_FITS: [string, ImageFit, ImagePlacement][] = [
  [
    "small image keeps its size and is centred",
    { contentWidth: 267, availableHeight: 165, imgWidth: 100, imgHeight: 50 },
    { width: 100, height: 50, offsetX: 83.5 },
  ],
  [
    "wide image shrinks to the content width",
    { contentWidth: 200, availableHeight: 200, imgWidth: 400, imgHeight: 100 },
    { width: 200, height: 50, offsetX: 0 },
  ],
  [
    "tall image shrinks to the available height and is centred",
    { contentWidth: 200, availableHeight: 100, imgWidth: 100, imgHeight: 400 },
    { width: 25, height: 100, offsetX: 87.5 },
  ],
  [
    "exact fit is not scaled",
    { contentWidth: 100, availableHeight: 50, imgWidth: 100, imgHeight: 50 },
    { width: 100, height: 50, offsetX: 0 },
  ],
];

const FOOTER_RESERVES: [string, ContentCounts, number][] = [
  ["empty plan", { rooms: 0, furniture: 0, walls: 0 }, 12],
  ["walls only add the dimensions line", { rooms: 0, furniture: 0, walls: 4 }, 26],
  ["one room takes one row", { rooms: 1, furniture: 0, walls: 0 }, 27],
  ["three rooms still take one row", { rooms: 3, furniture: 0, walls: 0 }, 27],
  ["four rooms take two rows", { rooms: 4, furniture: 0, walls: 0 }, 34],
  ["two pieces take one row", { rooms: 0, furniture: 2, walls: 0 }, 26],
  ["three pieces take two rows", { rooms: 0, furniture: 3, walls: 0 }, 32],
  ["everything together", { rooms: 4, furniture: 3, walls: 4 }, 68],
];

describe("pageSize", () => {
  test.each(PAGE_SIZES)("%s %s", (paper, orientation, expected) => {
    expect(pageSize(paper, orientation)).toEqual(expected);
  });
});

describe("placeImage", () => {
  test.each(IMAGE_FITS)("%s", (_, fit, expected) => {
    expect(placeImage(fit)).toEqual(expected);
  });
});

describe("footerReserveMm", () => {
  test.each(FOOTER_RESERVES)("%s", (_, counts, expected) => {
    expect(footerReserveMm(ALL_SECTIONS, counts)).toBe(expected);
  });

  test("sections switched off reserve nothing", () => {
    expect(footerReserveMm(NO_SECTIONS, { rooms: 4, furniture: 3, walls: 4 })).toBe(
      PDF_FOOTER_MIN_MM,
    );
  });
});
