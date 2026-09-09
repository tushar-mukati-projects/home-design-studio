"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Undo2, Redo2, Grid3x3, Magnet, Box, Share2, Clock, Compass, ImageUp } from "lucide-react";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import { ExportMenu } from "../export/export-menu";
import { PlanBadge } from "@/features/billing/plan-badge";
import { useFetchPlan } from "@/hooks/billing";

interface EditorToolbarProps {
  designName: string;
  onNameChange: (name: string) => void;
  onToggle3DPreview: () => void;
  onToggleShare: () => void;
  onToggleHistory: () => void;
  onToggleUpgrade: () => void;
  onToggleImport: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  canEdit?: boolean;
  isOwner?: boolean;
}

export const EditorToolbar = ({
  designName,
  onNameChange,
  onToggle3DPreview,
  onToggleShare,
  onToggleHistory,
  onToggleUpgrade,
  onToggleImport,
  stageRef,
  canEdit = true,
  isOwner = false,
}: EditorToolbarProps) => {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(designName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: planData } = useFetchPlan();

  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const past = useEditorStore((s) => s.past);
  const future = useEditorStore((s) => s.future);
  const showGrid = useEditorStore((s) => s.showGrid);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const toggleSnap = useEditorStore((s) => s.toggleSnap);

  useEffect(() => {
    setNameValue(designName);
  }, [designName]);

  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== designName) {
      onNameChange(nameValue.trim());
    } else {
      setNameValue(designName);
    }
  };

  return (
    <div className="flex h-12 items-center gap-1 border-b border-[var(--border)] bg-[var(--card)] px-2 sm:gap-2 sm:px-4">
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Tooltip content="Back to Dashboard" side="bottom">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)] text-white transition-colors hover:bg-[#3d3d40] sm:h-9 sm:w-9"
          >
            <Compass className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </Tooltip>

        <div className="hidden flex-col sm:flex">
          {!canEdit ? (
            <span className="max-w-[120px] truncate text-sm font-semibold text-[var(--foreground)] md:max-w-[200px]">
              {designName || "Untitled design"}
            </span>
          ) : isEditingName ? (
            <input
              ref={inputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
                if (e.key === "Escape") {
                  setNameValue(designName);
                  setIsEditingName(false);
                }
              }}
              className="h-7 w-28 rounded border border-[var(--input)] bg-[var(--background)] px-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)] md:w-48"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="max-w-[120px] truncate text-left text-sm font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--muted-foreground)] md:max-w-[200px]"
            >
              {designName || "Untitled design"}
            </button>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="hidden flex-1 items-center justify-center gap-1 md:flex">
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5">
            <Tooltip content="Undo (Ctrl+Z)" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={undo}
                disabled={past.length === 0}
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={redo}
                disabled={future.length === 0}
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <div className="mx-0.5 h-4 w-px bg-[var(--border)]" />
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
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={undo}
            disabled={past.length === 0}
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={redo}
            disabled={future.length === 0}
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {!canEdit && (
        <>
          <span className="ml-1 rounded-full bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] sm:ml-2 sm:px-3 sm:py-1 sm:text-xs">
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
              className="gap-1.5 text-[var(--muted-foreground)]"
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
              className="gap-1.5 text-[var(--muted-foreground)]"
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
