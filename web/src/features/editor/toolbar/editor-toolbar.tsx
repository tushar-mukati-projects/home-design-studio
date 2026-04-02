"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  MousePointer2,
  PenLine,
  DoorOpen,
  Columns2,
  Eraser,
  Hand,
  Sofa,
  Undo2,
  Redo2,
  Grid3x3,
  Magnet,
  Box,
  Share2,
  Clock,
} from "lucide-react";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/stores/editor-store";
import { ExportMenu } from "../export/export-menu";
import { PlanBadge } from "@/features/billing/plan-badge";
import { useFetchPlan } from "@/hooks/billing";
import type { EditorTool } from "@/types";

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

interface ToolConfig {
  tool: EditorTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const TOOLS: ToolConfig[] = [
  { tool: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select", shortcut: "V" },
  { tool: "wall", icon: <PenLine className="h-4 w-4" />, label: "Draw Wall", shortcut: "W" },
  { tool: "door", icon: <DoorOpen className="h-4 w-4" />, label: "Door", shortcut: "D" },
  { tool: "window", icon: <Columns2 className="h-4 w-4" />, label: "Window" },
  { tool: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser", shortcut: "E" },
  { tool: "pan", icon: <Hand className="h-4 w-4" />, label: "Pan", shortcut: "H" },
];

export const EditorToolbar = ({
  designName,
  onNameChange,
  onToggle3DPreview,
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

  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
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
    <div className="flex h-12 items-center gap-1 border-b border-[var(--border)] bg-[var(--card)] px-3">
      <Tooltip content="Back to Dashboard" side="bottom">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Tooltip>

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
          className="h-7 w-48 rounded border border-[var(--input)] bg-[var(--background)] px-2 text-sm text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
        />
      ) : (
        <button
          onClick={() => setIsEditingName(true)}
          className="max-w-[200px] truncate rounded px-2 py-1 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
        >
          {designName || "Untitled Design"}
        </button>
      )}

      {canEdit && (
        <>
          <Separator orientation="vertical" className="mx-2 h-6" />

          <div className="flex items-center gap-0.5">
            {TOOLS.map((t) => (
              <Tooltip
                key={t.tool}
                content={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
                side="bottom"
              >
                <Button
                  variant={activeTool === t.tool ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setTool(t.tool)}
                  className={
                    activeTool === t.tool
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : ""
                  }
                >
                  {t.icon}
                </Button>
              </Tooltip>
            ))}
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <div className="flex items-center gap-0.5">
            <Tooltip content="Undo (Ctrl+Z)" side="bottom">
              <Button variant="ghost" size="icon" onClick={undo} disabled={past.length === 0}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Redo (Ctrl+Shift+Z)" side="bottom">
              <Button variant="ghost" size="icon" onClick={redo} disabled={future.length === 0}>
                <Redo2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <div className="flex items-center gap-0.5">
            <Tooltip content={`Grid (G) ${showGrid ? "On" : "Off"}`} side="bottom">
              <Button variant={showGrid ? "secondary" : "ghost"} size="icon" onClick={toggleGrid}>
                <Grid3x3 className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content={`Snap (S) ${snapToGrid ? "On" : "Off"}`} side="bottom">
              <Button variant={snapToGrid ? "secondary" : "ghost"} size="icon" onClick={toggleSnap}>
                <Magnet className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>

          <Separator orientation="vertical" className="mx-2 h-6" />

          <Tooltip content="Furniture Catalog" side="bottom">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleFurniture}>
              <Sofa className="h-3.5 w-3.5" />
              <span className="text-xs">Furniture</span>
            </Button>
          </Tooltip>
        </>
      )}

      {!canEdit && (
        <span className="ml-2 rounded-full bg-[var(--secondary)] px-3 py-1 text-xs font-medium text-[var(--muted-foreground)]">
          View Only
        </span>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <PlanBadge onClick={onToggleUpgrade} />

        {canEdit && (
          <Tooltip content="Version History" side="bottom">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggleHistory}>
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">History</span>
            </Button>
          </Tooltip>
        )}
        {isOwner && (
          <Tooltip content="Share" side="bottom">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={planData?.canShare ? onToggleShare : onToggleUpgrade}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="text-xs">Share</span>
            </Button>
          </Tooltip>
        )}
        <Tooltip content="3D Preview" side="bottom">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onToggle3DPreview}>
            <Box className="h-3.5 w-3.5" />
            <span className="text-xs">3D Preview</span>
          </Button>
        </Tooltip>

        <ExportMenu stageRef={stageRef} designName={designName} designId={designId} />
      </div>
    </div>
  );
};
