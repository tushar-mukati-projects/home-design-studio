"use client";

import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api-error";
import { useEditorStore } from "@/stores/editor-store";
import {
  EXPORT_PIXEL_RATIO,
  EXPORT_PIXEL_RATIO_HIGH,
  captureStage,
  exportFileName,
  readyStage,
} from "./capture";
import type { StageRef } from "./capture";
import { buildPdf } from "./pdf-document";
import type { PdfExportOptions } from "./pdf-layout";

const POPUP_BLOCKED_MESSAGE = "Pop-up blocked. Please allow pop-ups and try again.";

export const useExport = () => {
  const exportAsPng = (stageRef: StageRef, designName: string) => {
    try {
      const { dataUrl } = captureStage(readyStage(stageRef), EXPORT_PIXEL_RATIO);
      download(dataUrl, `${exportFileName(designName)}-floorplan.png`);
      toast.success("Floor plan exported as PNG");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to export as PNG"));
    }
  };

  const exportAsPdf = (stageRef: StageRef, designName: string, options: PdfExportOptions) => {
    try {
      const pixelRatio = options.quality === "high" ? EXPORT_PIXEL_RATIO_HIGH : EXPORT_PIXEL_RATIO;
      const capture = captureStage(readyStage(stageRef), pixelRatio);
      const { rooms, furniture, walls, catalog } = useEditorStore.getState();
      const doc = buildPdf(capture, options, { designName, rooms, furniture, walls, catalog });
      doc.save(`${exportFileName(designName)}-floorplan.pdf`);
      toast.success("Floor plan exported as PDF");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to export as PDF"));
    }
  };

  const printFloorPlan = (stageRef: StageRef) => {
    try {
      const { dataUrl } = captureStage(readyStage(stageRef), EXPORT_PIXEL_RATIO);
      const printWindow = window.open("", "_blank");
      if (!printWindow) throw new Error(POPUP_BLOCKED_MESSAGE);
      printWindow.document.write(printPage(dataUrl));
      printWindow.onload = () => {
        toast.success("Print dialog opened");
        printWindow.focus();
        printWindow.print();
      };
      printWindow.document.close();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to print floor plan"));
    }
  };

  return { exportAsPng, exportAsPdf, printFloorPlan };
};

const download = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const printPage = (dataUrl: string): string => `<!DOCTYPE html>
<html>
<head>
<title>Print Floor Plan</title>
<style>
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
  img { max-width: 100%; max-height: 100vh; object-fit: contain; }
</style>
</head>
<body><img src="${dataUrl}" /></body>
</html>`;
