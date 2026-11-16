"use client";

import { memo, useEffect, useState, type RefObject } from "react";
import { Layer, Stage } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";
import { CollaboratorCursors } from "../collaboration/collaborator-cursors";
import { FurnitureShapes } from "./furniture-layer";
import { OpeningShapes } from "./opening-layer";
import { RoomLabels, RoomShapes } from "./room-layer";
import { useCanvasInput } from "./use-canvas-input";
import { useCatalogDrop } from "./use-catalog-drop";
import { useViewport } from "./use-viewport";
import { WallShapes } from "./wall-layer";
import { WallPreview } from "./wall-preview";
import type Konva from "konva";

const INITIAL_STAGE_SIZE = { width: 800, height: 600 };

type EditorCanvasProps = {
  containerRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<Konva.Stage | null>;
  onCursorMove?: (x: number, y: number) => void;
};

const PlanStage = ({ containerRef, stageRef, onCursorMove }: EditorCanvasProps) => {
  const [stageSize, setStageSize] = useState(INITIAL_STAGE_SIZE);
  const { viewRef, applyView, scheduleCommit, stopAnimation, handleWheel, committed } = useViewport(
    { containerRef, stageRef },
  );
  const {
    pointerRef,
    overlayRef,
    openingPriorityRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvasInput({
    stageRef,
    viewRef,
    applyView,
    scheduleCommit,
    stopAnimation,
    onCursorMove,
  });
  useCatalogDrop(stageRef);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setStageSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  const k = committed.zoom * PX_PER_MM;

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={k}
      scaleY={k}
      x={committed.panX}
      y={committed.panY}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={() => useEditorStore.getState().stopDrawing()}
      onContextMenu={(e) => e.evt.preventDefault()}
    >
      <Layer>
        <RoomShapes />
        <WallShapes openingPriorityRef={openingPriorityRef} />
        <OpeningShapes />
      </Layer>
      <Layer>
        <FurnitureShapes />
      </Layer>
      <Layer listening={false}>
        <RoomLabels />
      </Layer>
      <Layer ref={overlayRef} listening={false} name={EXPORT_HIDDEN_LAYER_NAME}>
        <WallPreview pointerRef={pointerRef} />
        <CollaboratorCursors />
      </Layer>
    </Stage>
  );
};

export const EditorCanvas = memo(PlanStage);
