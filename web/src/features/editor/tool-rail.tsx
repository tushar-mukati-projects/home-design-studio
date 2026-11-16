"use client";

import { Columns2, DoorOpen, Eraser, Hand, Layers, MousePointer2, PenLine } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { shortcutForTool } from "./keyboard-shortcuts";
import type { EditorTool } from "@/types";

type ToolRailLayout = "desktop" | "mobile";

type ToolRailProps = {
  layout: ToolRailLayout;
  onToggleLayers: () => void;
};

type RailTool = {
  tool: EditorTool;
  icon: React.ReactNode;
  label: string;
};

type ToolButtonProps = {
  layout: ToolRailLayout;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const TOOLS: RailTool[] = [
  { tool: "select", icon: <MousePointer2 className="h-5 w-5" />, label: "Select" },
  { tool: "wall", icon: <PenLine className="h-5 w-5" />, label: "Draw Wall" },
  { tool: "door", icon: <DoorOpen className="h-5 w-5" />, label: "Door" },
  { tool: "window", icon: <Columns2 className="h-5 w-5" />, label: "Window" },
  { tool: "eraser", icon: <Eraser className="h-5 w-5" />, label: "Eraser" },
  { tool: "pan", icon: <Hand className="h-5 w-5" />, label: "Pan" },
];

export const ToolRail = ({ layout, onToggleLayers }: ToolRailProps) => {
  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const desktop = layout === "desktop";

  return (
    <div
      className={cn(
        "border-border bg-sidebar",
        desktop
          ? "hidden w-14 shrink-0 flex-col items-center gap-1 border-r py-3 md:flex"
          : "absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border p-1 shadow-lg md:hidden",
      )}
    >
      {TOOLS.map((t) => {
        const button = (
          <ToolButton
            key={t.tool}
            layout={layout}
            active={activeTool === t.tool}
            onClick={() => setTool(t.tool)}
          >
            {t.icon}
          </ToolButton>
        );
        return desktop ? (
          <Tooltip key={t.tool} content={`${t.label} (${shortcutForTool(t.tool)})`} side="right">
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
      <div className={cn("bg-sidebar-border", desktop ? "my-2 h-px w-6" : "mx-0.5 h-5 w-px")} />
      {desktop ? (
        <Tooltip content="Layers" side="right">
          <ToolButton layout={layout} active={false} onClick={onToggleLayers}>
            <Layers className="h-5 w-5" />
          </ToolButton>
        </Tooltip>
      ) : (
        <ToolButton layout={layout} active={false} onClick={onToggleLayers}>
          <Layers className="h-5 w-5" />
        </ToolButton>
      )}
    </div>
  );
};

const ToolButton = ({ layout, active, onClick, children }: ToolButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "flex shrink-0 items-center justify-center transition-all",
      layout === "desktop" ? "h-10 w-10 rounded-lg" : "h-9 w-9 rounded-md",
      active
        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md"
        : "text-sidebar-foreground",
      !active &&
        layout === "desktop" &&
        "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
    )}
  >
    {children}
  </button>
);
