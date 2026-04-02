"use client";

import { useState } from "react";
import type Konva from "konva";
import { Download, Image as ImageIcon, FileText, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useExport } from "./use-export";
import { ExportDialog } from "./export-dialog";

interface ExportMenuProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  designName: string;
}

const ExportMenu = ({ stageRef, designName }: ExportMenuProps) => {
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const { exportAsPng, printFloorPlan } = useExport();

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
            <ImageIcon className="mr-2 h-4 w-4 text-[#52525b]" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPdfDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4 text-[#52525b]" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => printFloorPlan(stageRef)}>
            <Printer className="mr-2 h-4 w-4 text-[#52525b]" />
            Print
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        stageRef={stageRef}
        designName={designName}
      />
    </>
  );
};

export { ExportMenu };
