"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Undo2,
  Redo2,
  Grid3x3,
  Magnet,
  Box,
  Share2,
  Clock,
  Compass,
} from "lucide-react";
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
  onToggleFurniture: () => void;
  onToggleShare: () => void;
  onToggleHistory: () => void;
  onToggleUpgrade: () => void;
  stageRef: React.RefObject<Konva.Stage | null>;
  designId: string;
  canEdit?: boolean;
  isOwner?: boolean;
}

export const EditorToolbar = ({
  designName,
  onNameChange,
  onToggle3DPreview,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onToggleFurniture,
  onToggleShare,
  onToggleHistory,
  onToggleUpgrade,
  stageRef,
  designId,
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
    <div className="flex h-12 items-center gap-2 border-b border-[var(--border)] bg-[var(--card)] px-4">
      {/* Left: logo + project name */}
      <div className="flex items-center gap-3">
        <Tooltip content="Back to Dashboard" side="bottom">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white transition-colors hover:bg-[#3d3d40]"
          >
            <Compass className="h-5 w-5" />
          </button>
        </Tooltip>

        <div className="flex flex-col">
          {isEditingName ? (
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
              className="h-7 w-48 rounded border border-[var(--input)] bg-[var(--background)] px-2 text-sm font-semibold text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
            />
          ) : (
            <button
              onClick={() => setIsEditingName(true)}
              className="text-left text-sm font-semibold text-[var(--foreground)] transition-colors hover:text-[var(--muted-foreground)]"
            >
              {designName || "Untitled Design"}
            </button>
          )}
          <span className="text-[10px] font-medium tracking-wider text-[var(--muted-foreground)] uppercase">
            Floor 1
          </span>
        </div>
      </div>

      {/* Center: undo/redo + grid/snap */}
      {canEdit && (
        <div className="flex flex-1 items-center justify-center gap-1">
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--background)] p-0.5">
            <Tooltip content="Undo (Ctrl+Z)" side="bottom">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={past.length === 0}>
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={future.length === 0}>
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <div className="mx-0.5 h-4 w-px bg-[var(--border)]" />
            <Tooltip content={`Grid (G) ${showGrid ? "On" : "Off"}`} side="bottom">
              <Button variant={showGrid ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={toggleGrid}>
                <Grid3x3 className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
            <Tooltip content={`Snap (S) ${snapToGrid ? "On" : "Off"}`} side="bottom">
              <Button variant={snapToGrid ? "secondary" : "ghost"} size="icon" className="h-7 w-7" onClick={toggleSnap}>
                <Magnet className="h-3.5 w-3.5" />
              </Button>
            </Tooltip>
          </div>
        </div>
      )}

      {!canEdit && (
        <>
          <span className="ml-2 rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
            View Only
          </span>
          <div className="flex-1" />
        </>
      )}

      {/* Right: action buttons */}
      <div className="flex items-center gap-1.5">
        <PlanBadge onClick={onToggleUpgrade} />

        {canEdit && (
          <Tooltip content="Version History" side="bottom">
            <Button variant="ghost" size="sm" className="gap-1.5 text-[var(--muted-foreground)]" onClick={onToggleHistory}>
              <Clock className="h-3.5 w-3.5" />
              <span className="hidden text-xs sm:inline">History</span>
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
              <span className="hidden text-xs sm:inline">Share</span>
            </Button>
          </Tooltip>
        )}
        <Tooltip content="3D Preview" side="bottom">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggle3DPreview}>
            <Box className="h-3.5 w-3.5" />
            <span className="hidden text-xs sm:inline">3D</span>
          </Button>
        </Tooltip>

        <ExportMenu stageRef={stageRef} designName={designName} designId={designId} />
      </div>
    </div>
  );
};
