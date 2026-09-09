"use client";

import { useState, useEffect, useRef } from "react";
import type Konva from "konva";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useExport } from "./use-export";
import type { PaperSize, Orientation, Quality, PdfExportOptions } from "./use-export";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  designName: string;
}

const ExportDialog = ({ open, onOpenChange, stageRef, designName }: ExportDialogProps) => {
  const { exportAsPdf } = useExport();
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [includeRoomLabels, setIncludeRoomLabels] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includeFurnitureList, setIncludeFurnitureList] = useState(true);
  const [quality, setQuality] = useState<Quality>("standard");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const previewGenerated = useRef(false);

  useEffect(() => {
    if (open && stageRef.current && !previewGenerated.current) {
      try {
        const url = stageRef.current.toDataURL({ pixelRatio: 0.5 });
        setPreviewUrl(url);
        previewGenerated.current = true;
      } catch {
        setPreviewUrl(null);
      }
    }
    if (!open) {
      previewGenerated.current = false;
    }
  }, [open, stageRef]);

  const handleExport = () => {
    setExporting(true);
    const options: PdfExportOptions = {
      paperSize,
      orientation,
      includeRoomLabels,
      includeDimensions,
      includeFurnitureList,
      quality,
    };

    requestAnimationFrame(() => {
      exportAsPdf(stageRef, designName, options);
      setExporting(false);
      onOpenChange(false);
    });
  };

  const paperSizeOptions = [
    { value: "a4", label: "A4 (210 x 297 mm)" },
    { value: "a3", label: "A3 (297 x 420 mm)" },
  ];

  const qualityOptions = [
    { value: "standard", label: "Standard (faster)" },
    { value: "high", label: "High (better quality)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2c2c2e]" />
            Export as PDF
          </DialogTitle>
          <DialogDescription>Configure your PDF export settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {previewUrl && (
            <div
              className={cn(
                "relative overflow-hidden rounded-md border border-[var(--border)] bg-[var(--secondary)]",
                orientation === "landscape" ? "aspect-[4/3]" : "aspect-[3/4]",
              )}
            >
              <img
                src={previewUrl}
                alt="Floor plan preview"
                className="h-full w-full object-contain p-2"
              />
              <div className="absolute right-1 bottom-1">
                <span className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  Preview
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Paper Size</label>
              <Select
                value={paperSize}
                onValueChange={(v) => setPaperSize(v as PaperSize)}
                options={paperSizeOptions}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Orientation</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation("landscape")}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    orientation === "landscape"
                      ? "border-[#2c2c2e] bg-[#2c2c2e]/10 text-[#2c2c2e]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]",
                  )}
                >
                  <span className="inline-block h-3 w-5 rounded-sm border border-current" />
                  Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation("portrait")}
                  className={cn(
                    "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    orientation === "portrait"
                      ? "border-[#2c2c2e] bg-[#2c2c2e]/10 text-[#2c2c2e]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]",
                  )}
                >
                  <span className="inline-block h-5 w-3 rounded-sm border border-current" />
                  Portrait
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">
                Include in Export
              </label>
              <CheckboxItem
                checked={includeRoomLabels}
                onChange={setIncludeRoomLabels}
                label="Room labels and areas"
              />
              <CheckboxItem
                checked={includeDimensions}
                onChange={setIncludeDimensions}
                label="Wall dimensions"
              />
              <CheckboxItem
                checked={includeFurnitureList}
                onChange={setIncludeFurnitureList}
                label="Furniture list"
              />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--foreground)]">Quality</label>
              <Select
                value={quality}
                onValueChange={(v) => setQuality(v as Quality)}
                options={qualityOptions}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting}
            className="bg-[#2c2c2e] text-black hover:bg-[#2c2c2e]/90"
          >
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface CheckboxItemProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

const CheckboxItem = ({ checked, onChange, label }: CheckboxItemProps) => {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
          checked
            ? "border-[#2c2c2e] bg-[#2c2c2e] text-black"
            : "border-[var(--border)] bg-transparent",
        )}
      >
        {checked && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 5.5L4 7.5L8 3" />
          </svg>
        )}
      </button>
      <span className="text-sm text-[var(--foreground)]">{label}</span>
    </label>
  );
};

export { ExportDialog };
