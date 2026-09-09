import { useState } from "react";
import { useEditorStore } from "@/stores/editor-store";
import type Konva from "konva";

export const useHover = () => {
  const [over, setOver] = useState(false);
  const selecting = useEditorStore((s) => s.activeTool === "select");

  const onMouseEnter = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (useEditorStore.getState().activeTool !== "select") return;
    setOver(true);
    e.target.getStage()?.container().style.setProperty("cursor", "pointer");
  };
  const onMouseLeave = (e: Konva.KonvaEventObject<MouseEvent>) => {
    setOver(false);
    if (useEditorStore.getState().activeTool === "select")
      e.target.getStage()?.container().style.setProperty("cursor", "default");
  };

  return { hovered: over && selecting, onMouseEnter, onMouseLeave };
};
