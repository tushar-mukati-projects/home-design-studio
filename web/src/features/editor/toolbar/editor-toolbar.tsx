"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Grid3x3, Magnet, Box, Share2, Clock, Compass, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { DEFAULT_DESIGN_NAME } from "@/lib/constants";
import { DESIGN_NAME_MAX_CHARS } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { PlanBadge } from "@/features/billing/plan-badge";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import type { StageRef } from "../export/capture";
import { ExportMenu } from "../export/export-menu";
import { HistoryButtons } from "./history-buttons";

type EditorToolbarProps = {
  designName: string;
  onNameChange: (name: string) => void;
  onToggle3DPreview: () => void;
  onToggleShare: () => void;
  onToggleHistory: () => void;
  onToggleUpgrade: () => void;
  onToggleImport: () => void;
  stageRef: StageRef;
  canEdit: boolean;
  isOwner: boolean;
};

export const EditorToolbar = ({
  designName,
  onNameChange,
  onToggle3DPreview,
  onToggleShare,
  onToggleHistory,
  onToggleUpgrade,
  onToggleImport,
  stageRef,
  canEdit,
  isOwner,
}: EditorToolbarProps) => {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const { data: planData } = useFetchPlan();

  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const toggleSnap = useEditorStore((s) => s.toggleSnap);

  const shownName = designName || DEFAULT_DESIGN_NAME;

  const startEditingName = () => {
    setNameValue(designName);
    setIsEditingName(true);
  };

  const submitName = () => {
    setIsEditingName(false);
    const name = nameValue.trim();
    if (name !== "" && name !== designName) onNameChange(name);
  };

  return (
    <div className="flex h-12 items-center gap-1 border-b border-border bg-card px-2 sm:gap-2 sm:px-4">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Tooltip content="Back to Dashboard" side="bottom">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-accent sm:h-9 sm:w-9"
          >
            <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </Tooltip>

        <div className="hidden flex-col sm:flex">
          {!canEdit ? (
            <span className="max-w-30 truncate text-sm font-semibold text-foreground md:max-w-50">
              {shownName}
            </span>
          ) : isEditingName ? (
            <input
              autoFocus
              value={nameValue}
              maxLength={DESIGN_NAME_MAX_CHARS}
              onChange={(e) => setNameValue(e.target.value)}
              onFocus={(e) => e.target.select()}
              onBlur={submitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitName();
                if (e.key === "Escape") {
                  setNameValue(designName);
                  setIsEditingName(false);
                }
              }}
              className="h-7 w-28 rounded border border-input bg-background px-2 text-sm font-semibold text-foreground outline-none focus:ring-1 focus:ring-ring md:w-48"
            />
          ) : (
            <button
              onClick={startEditingName}
              className="max-w-30 truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-muted-foreground md:max-w-50"
            >
              {shownName}
            </button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background p-0.5">
            <HistoryButtons />
            <div className="mx-0.5 h-4 w-px bg-border" />
            <Tooltip content={`Grid (G) ${showGrid ? "On" : "Off"}`} side="bottom">
              <Button
                variant={showGrid ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={toggleGrid}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content={`Snap (S) ${snapToGrid ? "On" : "Off"}`} side="bottom">
              <Button
                variant={snapToGrid ? "secondary" : "ghost"}
                size="icon"
                className="h-7 w-7"
                onClick={toggleSnap}
              >
                <Magnet className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="flex items-center gap-0.5 md:hidden">
          <HistoryButtons />
        </div>
      )}

      {!canEdit && (
        <>
          <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-2xs font-medium text-muted-foreground sm:ml-2 sm:px-3 sm:py-1 sm:text-xs">
            View Only
          </span>
          <div className="flex-1" />
        </>
      )}

      <div className="flex-1 md:hidden" />

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
        <span className="hidden sm:inline-flex">
          <PlanBadge onClick={onToggleUpgrade} />
        </span>

        {canEdit && (
          <Tooltip content="Versions" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={onToggleHistory}
            >
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden text-xs lg:inline">Versions</span>
            </Button>
          </Tooltip>
        )}
        {isOwner && (
          <Tooltip content="Share" side="bottom">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={planData?.canShare ? onToggleShare : onToggleUpgrade}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden text-xs lg:inline">Share</span>
            </Button>
          </Tooltip>
        )}
        {canEdit && (
          <Tooltip content="Import from Image" side="bottom">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleImport}>
              <ImageUp className="h-3.5 w-3.5" />
              <span className="hidden text-xs lg:inline">Import</span>
            </Button>
          </Tooltip>
        )}
        <Tooltip content="3D Preview" side="bottom">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggle3DPreview}>
            <Box className="h-3.5 w-3.5" />
            <span className="hidden text-xs lg:inline">3D</span>
          </Button>
        </Tooltip>

        <ExportMenu stageRef={stageRef} designName={designName} />
      </div>
    </div>
  );
};
