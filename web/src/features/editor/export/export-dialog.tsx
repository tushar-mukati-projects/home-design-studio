"use client";

import { useState } from "react";
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
import type { StageRef } from "./capture";
import type { PaperSize, Orientation, Quality, PdfExportOptions } from "./pdf-layout";
import { useExport } from "./use-export";
import { useEditorModal } from "../use-editor-modal";

type ExportDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageRef: StageRef;
  designName: string;
  previewUrl: string;
};

type OrientationButtonProps = {
  value: Orientation;
  label: string;
  selected: boolean;
  onSelect: (value: Orientation) => void;
};

type CheckboxItemProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

const ORIENTATIONS: [Orientation, string][] = [
  ["landscape", "Landscape"],
  ["portrait", "Portrait"],
];

const PAPER_SIZE_OPTIONS = [
  { value: "a4", label: "A4 (210 x 297 mm)" },
  { value: "a3", label: "A3 (297 x 420 mm)" },
];

const QUALITY_OPTIONS = [
  { value: "standard", label: "Standard (faster)" },
  { value: "high", label: "High (better quality)" },
];

export const ExportDialog = ({
  open,
  onOpenChange,
  stageRef,
  designName,
  previewUrl,
}: ExportDialogProps) => {
  const { exportAsPdf } = useExport();
  const [paperSize, setPaperSize] = useState<PaperSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [includeRoomLabels, setIncludeRoomLabels] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includeFurnitureList, setIncludeFurnitureList] = useState(true);
  const [quality, setQuality] = useState<Quality>("standard");
  const [exporting, setExporting] = useState(false);

  useEditorModal(open);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Export as PDF
          </DialogTitle>
          <DialogDescription>Configure your PDF export settings</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div
            className={cn(
              "relative overflow-hidden rounded-md border border-border bg-secondary",
              orientation === "landscape" ? "aspect-[4/3]" : "aspect-[3/4]",
            )}
          >
            <img
              src={previewUrl}
              alt="Floor plan preview"
              className="h-full w-full object-contain p-2"
            />
            <span className="absolute right-1 bottom-1 rounded bg-foreground/60 px-1.5 py-0.5 text-2xs text-background">
              Preview
            </span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Paper Size</label>
              <Select
                value={paperSize}
                onValueChange={(v) => setPaperSize(v as PaperSize)}
                options={PAPER_SIZE_OPTIONS}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Orientation</label>
              <div className="flex flex-wrap gap-2">
                {ORIENTATIONS.map(([value, label]) => (
                  <OrientationButton
                    key={value}
                    value={value}
                    label={label}
                    selected={orientation === value}
                    onSelect={setOrientation}
                  />
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Include in Export</label>
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
              <label className="text-sm font-medium text-foreground">Quality</label>
              <Select
                value={quality}
                onValueChange={(v) => setQuality(v as Quality)}
                options={QUALITY_OPTIONS}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const OrientationButton = ({ value, label, selected, onSelect }: OrientationButtonProps) => (
  <button
    type="button"
    onClick={() => onSelect(value)}
    className={cn(
      "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
      selected
        ? "border-primary bg-primary/10 text-primary"
        : "border-border text-muted-foreground hover:bg-secondary",
    )}
  >
    <span
      className={cn(
        "inline-block rounded-sm border border-current",
        value === "landscape" ? "h-3 w-5" : "h-5 w-3",
      )}
    />
    {label}
  </button>
);

const CheckboxItem = ({ checked, onChange, label }: CheckboxItemProps) => (
  <label className="flex cursor-pointer items-center gap-2.5">
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-transparent",
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
    <span className="text-sm text-foreground">{label}</span>
  </label>
);
