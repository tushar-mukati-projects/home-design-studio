"use client";

import { useState } from "react";
import { Download, Image as ImageIcon, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { getApiErrorMessage } from "@/lib/api-error";
import { PREVIEW_PIXEL_RATIO, captureStage, readyStage } from "./capture";
import type { StageRef } from "./capture";
import { ExportDialog } from "./export-dialog";
import { useExport } from "./use-export";

type ExportMenuProps = {
  stageRef: StageRef;
  designName: string;
};

export const ExportMenu = ({ stageRef, designName }: ExportMenuProps) => {
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const { exportAsPng, printFloorPlan } = useExport();

  const openPdfDialog = () => {
    try {
      setPreviewUrl(captureStage(readyStage(stageRef), PREVIEW_PIXEL_RATIO).dataUrl);
      setPdfDialogOpen(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to preview the floor plan"));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => exportAsPng(stageRef, designName)}>
            <ImageIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={openPdfDialog}>
            <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => printFloorPlan(stageRef)}>
            <Printer className="mr-2 h-4 w-4 text-muted-foreground" />
            Print
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        stageRef={stageRef}
        designName={designName}
        previewUrl={previewUrl}
      />
    </>
  );
};
