"use client";

import { useCallback } from "react";
import type Konva from "konva";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { useEditorStore } from "@/stores/editor-store";

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

const getStageDataUrl = (
  stageRef: React.RefObject<Konva.Stage | null>,
  pixelRatio: number,
): string => {
  if (!stageRef.current) {
    throw new Error("Canvas is not available");
  }
  return stageRef.current.toDataURL({ pixelRatio });
};

const triggerDownload = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatDate = (): string => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
};

export const useExport = () => {
  const rooms = useEditorStore((s) => s.rooms);
  const furniture = useEditorStore((s) => s.furniture);
  const walls = useEditorStore((s) => s.walls);

  const exportAsPng = useCallback(
    (stageRef: React.RefObject<Konva.Stage | null>, designName: string) => {
      try {
        const dataUrl = getStageDataUrl(stageRef, 2);
        const safeName = designName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "untitled";
        triggerDownload(dataUrl, `${safeName}-floorplan.png`);
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
        const dataUrl = getStageDataUrl(stageRef, pixelRatio);

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
        doc.text(formatDate(), pageWidth - margin, margin + 5, {
          align: "right",
        });
        doc.setTextColor(0, 0, 0);

        const headerHeight = 15;
        let footerReserve = 12;

        if (options.includeRoomLabels && rooms.length > 0) {
          footerReserve += 8 + Math.ceil(rooms.length / 3) * 7;
        }
        if (options.includeFurnitureList && furniture.length > 0) {
          footerReserve += 8 + Math.ceil(furniture.length / 2) * 6;
        }
        if (options.includeDimensions && walls.length > 0) {
          footerReserve += 14;
        }

        const availableHeight = pageHeight - margin * 2 - headerHeight - footerReserve;
        const availableWidth = contentWidth;

        const img = new Image();
        img.src = dataUrl;

        const stage = stageRef.current;
        const imgWidth = stage ? stage.width() : 800;
        const imgHeight = stage ? stage.height() : 600;

        const scaleX = availableWidth / imgWidth;
        const scaleY = availableHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const renderedWidth = imgWidth * scale;
        const renderedHeight = imgHeight * scale;
        const imgX = margin + (availableWidth - renderedWidth) / 2;
        const imgY = margin + headerHeight;

        doc.addImage(dataUrl, "PNG", imgX, imgY, renderedWidth, renderedHeight);

        doc.setDrawColor(200, 200, 200);
        doc.rect(imgX, imgY, renderedWidth, renderedHeight);

        let cursorY = imgY + renderedHeight + 8;

        if (options.includeDimensions && walls.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Dimensions", margin, cursorY);
          cursorY += 5;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");

          const totalLength = walls.reduce((sum, wall) => {
            const dx = wall.x2 - wall.x1;
            const dy = wall.y2 - wall.y1;
            return sum + Math.sqrt(dx * dx + dy * dy);
          }, 0);

          doc.text(
            `${walls.length} walls | Total length: ${(totalLength / 20).toFixed(1)}m | ${rooms.length} rooms`,
            margin,
            cursorY,
          );
          cursorY += 7;
        }

        if (options.includeRoomLabels && rooms.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Rooms", margin, cursorY);
          cursorY += 5;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");

          const colWidth = contentWidth / 3;
          rooms.forEach((room, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = margin + col * colWidth;
            const y = cursorY + row * 7;

            const hex = room.color.replace("#", "");
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);

            doc.setFillColor(r, g, b);
            doc.rect(x, y - 3, 4, 4, "F");
            doc.text(`${room.name} (${(room.area / 400).toFixed(1)} m\u00B2)`, x + 6, y);
          });
          cursorY += Math.ceil(rooms.length / 3) * 7 + 3;
        }

        if (options.includeFurnitureList && furniture.length > 0) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text("Furniture", margin, cursorY);
          cursorY += 5;
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");

          const colWidth = contentWidth / 2;
          furniture.forEach((item, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = margin + col * colWidth;
            const y = cursorY + row * 6;

            doc.text(`\u2022 ${item.furnitureItem.name} (${item.furnitureItem.category})`, x, y);
          });
          cursorY += Math.ceil(furniture.length / 2) * 6 + 3;
        }

        doc.setFontSize(7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Created with Home Design Studio | ${formatDate()}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" },
        );

        const safeName = designName.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "untitled";
        doc.save(`${safeName}-floorplan.pdf`);

        toast.success("Floor plan exported as PDF");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to export as PDF");
      }
    },
    [rooms, furniture, walls],
  );

  const copyShareLink = useCallback(async (designId: string) => {
    try {
      const url = `${window.location.origin}/editor/${designId}?view=shared`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard!");
    } catch {
      toast.error("Failed to copy share link");
    }
  }, []);

  const printFloorPlan = useCallback((stageRef: React.RefObject<Konva.Stage | null>) => {
    try {
      const dataUrl = getStageDataUrl(stageRef, 2);
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Pop-up blocked. Please allow pop-ups and try again.");
        return;
      }

      printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Print Floor Plan</title>
<style>
  @media print {
    body { margin: 0; }
    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
  }
  body {
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #fff;
  }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
</style>
</head>
<body>
<img src="${dataUrl}" />
</body>
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

  return {
    exportAsPng,
    exportAsPdf,
    copyShareLink,
    printFloorPlan,
  };
};

export type { PdfExportOptions, PaperSize, Orientation, Quality };
