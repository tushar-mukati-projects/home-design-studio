"use client";

import { useCallback } from "react";
import type Konva from "konva";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, formatArea, formatLength } from "@/lib/constants";
import { ROOM_USAGE_COLORS, furnitureName, polygonArea, wallLength } from "@/lib/canvas";

type PaperSize = "a4" | "letter" | "a3";
type Orientation = "landscape" | "portrait";
type Quality = "standard" | "high";

interface PdfExportOptions {
  paperSize: PaperSize;
  orientation: Orientation;
  includeRoomLabels: boolean;
  includeDimensions: boolean;
  includeFurnitureList: boolean;
  quality: Quality;
}

const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 297, height: 210 },
  letter: { width: 279.4, height: 215.9 },
  a3: { width: 420, height: 297 },
};

interface Capture {
  dataUrl: string;
  width: number;
  height: number;
}

const captureContent = (
  stageRef: React.RefObject<Konva.Stage | null>,
  pixelRatio: number,
): Capture => {
  const stage = stageRef.current;
  if (!stage) throw new Error("Canvas is not available");

  const prevScale = { x: stage.scaleX(), y: stage.scaleY() };
  const prevPos = { x: stage.x(), y: stage.y() };
  const hiddenLayers = stage.find(`.${EXPORT_HIDDEN_LAYER_NAME}`).filter((node) => node.visible());

  try {
    hiddenLayers.forEach((node) => node.visible(false));
    stage.position({ x: 0, y: 0 });

    const rect = stage.getClientRect({ skipTransform: false });
    const pad = 40;
    const hasContent =
      rect.width > 0 &&
      rect.height > 0 &&
      Number.isFinite(rect.width) &&
      Number.isFinite(rect.height);

    const region = hasContent
      ? {
          x: rect.x - pad,
          y: rect.y - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
        }
      : { x: 0, y: 0, width: stage.width(), height: stage.height() };

    const dataUrl = stage.toDataURL({ pixelRatio, ...region });
    return { dataUrl, width: region.width, height: region.height };
  } finally {
    hiddenLayers.forEach((node) => node.visible(true));
    stage.scale(prevScale);
    stage.position(prevPos);
    stage.batchDraw();
  }
};

const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatDate = (): string =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(),
  );

const safeName = (designName: string) =>
  designName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "untitled";

export const useExport = () => {
  const rooms = useEditorStore((s) => s.rooms);
  const furniture = useEditorStore((s) => s.furniture);
  const walls = useEditorStore((s) => s.walls);
  const catalog = useEditorStore((s) => s.catalog);

  const exportAsPng = useCallback(
    (stageRef: React.RefObject<Konva.Stage | null>, designName: string) => {
      try {
        const { dataUrl } = captureContent(stageRef, 2);
        triggerDownload(dataUrl, `${safeName(designName)}-floorplan.png`);
        toast.success("Floor plan exported as PNG");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to export as PNG");
      }
    },
    [],
  );

  const exportAsPdf = useCallback(
    (
      stageRef: React.RefObject<Konva.Stage | null>,
      designName: string,
      options: PdfExportOptions,
    ) => {
      try {
        const pixelRatio = options.quality === "high" ? 3 : 2;
        const {
          dataUrl,
          width: imgWidth,
          height: imgHeight,
        } = captureContent(stageRef, pixelRatio);

        const dims = PAPER_DIMENSIONS[options.paperSize];
        const pageWidth = options.orientation === "landscape" ? dims.width : dims.height;
        const pageHeight = options.orientation === "landscape" ? dims.height : dims.width;

        const doc = new jsPDF({
          orientation: options.orientation,
          unit: "mm",
          format: options.paperSize,
        });

        const margin = 15;
        const contentWidth = pageWidth - margin * 2;

        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text(designName || "Untitled Floor Plan", margin, margin + 5);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(120, 120, 120);
        doc.text(formatDate(), pageWidth - margin, margin + 5, { align: "right" });
        doc.setTextColor(0, 0, 0);

        const headerHeight = 15;
        let footerReserve = 12;
        if (options.includeRoomLabels && rooms.length > 0)
          footerReserve += 8 + Math.ceil(rooms.length / 3) * 7;
        if (options.includeFurnitureList && furniture.length > 0)
          footerReserve += 8 + Math.ceil(furniture.length / 2) * 6;
        if (options.includeDimensions && walls.length > 0) footerReserve += 14;

        const maxImageHeight = pageHeight - margin * 2 - headerHeight;
        const availableHeight = Math.max(maxImageHeight * 0.4, maxImageHeight - footerReserve);
        const scale = Math.min(contentWidth / imgWidth, availableHeight / imgHeight, 1);
        const renderedWidth = imgWidth * scale;
        const renderedHeight = imgHeight * scale;
        const imgX = margin + (contentWidth - renderedWidth) / 2;
        const imgY = margin + headerHeight;

        doc.addImage(dataUrl, "PNG", imgX, imgY, renderedWidth, renderedHeight);
        doc.setDrawColor(200, 200, 200);
        doc.rect(imgX, imgY, renderedWidth, renderedHeight);

        let cursorY = imgY + renderedHeight + 8;
        const bottomLimit = pageHeight - margin - 6;

        const ensureSpace = (needed: number) => {
          if (cursorY + needed > bottomLimit) {
            doc.addPage();
            cursorY = margin;
          }
        };

        const sectionHeading = (title: string) => {
          ensureSpace(12);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(title, margin, cursorY);
          cursorY += 5;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
        };

        const gridList = <T>(
          items: T[],
          columns: number,
          rowHeight: number,
          draw: (item: T, x: number, y: number) => void,
        ) => {
          const colWidth = contentWidth / columns;
          for (let i = 0; i < items.length; i += columns) {
            ensureSpace(rowHeight);
            items
              .slice(i, i + columns)
              .forEach((item, col) => draw(item, margin + col * colWidth, cursorY));
            cursorY += rowHeight;
          }
          cursorY += 3;
        };

        if (options.includeDimensions && walls.length > 0) {
          sectionHeading("Dimensions");
          const total = walls.reduce((sum, wall) => sum + wallLength(wall), 0);
          doc.text(
            `${walls.length} walls | Total length: ${formatLength(total)} | ${rooms.length} rooms`,
            margin,
            cursorY,
          );
          cursorY += 7;
        }

        if (options.includeRoomLabels && rooms.length > 0) {
          sectionHeading("Rooms");
          gridList(rooms, 3, 7, (room, x, y) => {
            const hex = ROOM_USAGE_COLORS[room.usage].replace("#", "");
            doc.setFillColor(
              parseInt(hex.slice(0, 2), 16),
              parseInt(hex.slice(2, 4), 16),
              parseInt(hex.slice(4, 6), 16),
            );
            doc.rect(x, y - 3, 4, 4, "F");
            doc.text(`${room.name} (${formatArea(polygonArea(room.polygon))})`, x + 6, y);
          });
        }

        if (options.includeFurnitureList && furniture.length > 0) {
          sectionHeading("Furniture");
          gridList(furniture, 2, 6, (piece, x, y) => {
            doc.text(`• ${furnitureName(piece, catalog)}`, x, y);
          });
        }

        const totalPages = doc.getNumberOfPages();
        for (let page = 1; page <= totalPages; page += 1) {
          doc.setPage(page);
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            totalPages > 1
              ? `Created with Home Design Studio | ${formatDate()} | Page ${page} of ${totalPages}`
              : `Created with Home Design Studio | ${formatDate()}`,
            pageWidth / 2,
            pageHeight - 8,
            { align: "center" },
          );
        }

        doc.save(`${safeName(designName)}-floorplan.pdf`);
        toast.success("Floor plan exported as PDF");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to export as PDF");
      }
    },
    [rooms, furniture, walls, catalog],
  );

  const copyShareLink = useCallback(async (designId: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/editor/${designId}?view=shared`,
      );
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to copy share link");
    }
  }, []);

  const printFloorPlan = useCallback((stageRef: React.RefObject<Konva.Stage | null>) => {
    try {
      const { dataUrl } = captureContent(stageRef, 2);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups and try again.");
        return;
      }

      printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Print Floor Plan</title>
<style>
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
</style>
</head>
<body><img src="${dataUrl}" /></body>
</html>`);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      toast.success("Print dialog opened");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to print floor plan");
    }
  }, []);

  return { exportAsPng, exportAsPdf, copyShareLink, printFloorPlan };
};

export type { PdfExportOptions, PaperSize, Orientation, Quality };
