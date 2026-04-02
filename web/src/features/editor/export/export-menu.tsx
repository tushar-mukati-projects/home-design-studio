"use client";

import { useState } from "react";
import type Konva from "konva";
import { Download, Image as ImageIcon, FileText, Link, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useExport } from "./use-export";
import { ExportDialog } from "./export-dialog";

interface ExportMenuProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  designName: string;
  designId: string;
}

const ExportMenu = ({ stageRef, designName, designId }: ExportMenuProps) => {
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const { exportAsPng, copyShareLink, printFloorPlan } = useExport();

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
            <ImageIcon className="mr-2 h-4 w-4 text-[#D4A853]" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPdfDialogOpen(true)}>
            <FileText className="mr-2 h-4 w-4 text-[#D4A853]" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => copyShareLink(designId)}>
            <Link className="mr-2 h-4 w-4 text-[#D4A853]" />
            Copy Share Link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => printFloorPlan(stageRef)}>
            <Printer className="mr-2 h-4 w-4 text-[#D4A853]" />
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
