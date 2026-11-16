"use client";

import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { ZOOM_STEP } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";

type ZoomControlsProps = {
  onFit: () => void;
};

type ZoomButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};

export const ZoomControls = ({ onFit }: ZoomControlsProps) => {
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);

  return (
    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-lg sm:bottom-4 sm:gap-1 sm:p-1">
      <ZoomButton label="Zoom Out" onClick={() => setZoom(zoom / ZOOM_STEP)}>
        <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </ZoomButton>
      <button
        onClick={onFit}
        className="min-w-10 px-1 py-1 font-mono text-2xs text-muted-foreground transition-colors hover:text-foreground sm:min-w-13 sm:px-2 sm:text-xs"
      >
        {Math.round(zoom * 100)}%
      </button>
      <ZoomButton label="Zoom In" onClick={() => setZoom(zoom * ZOOM_STEP)}>
        <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </ZoomButton>
      <div className="mx-0.5 h-4 w-px bg-border sm:h-5" />
      <ZoomButton label="Fit to Screen" onClick={onFit}>
        <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </ZoomButton>
    </div>
  );
};

const ZoomButton = ({ label, onClick, children }: ZoomButtonProps) => (
  <Tooltip content={label} side="top">
    <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onClick}>
      {children}
    </Button>
  </Tooltip>
);
