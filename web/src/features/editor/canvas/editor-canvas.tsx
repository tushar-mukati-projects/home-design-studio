"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM } from "@/lib/constants";
import {
  DEFAULTS,
  clampOpeningOffset,
  distanceToWall,
  furnitureSize,
  newId,
  offsetAlongWall,
  pointOnWall,
  toVec,
} from "@/lib/canvas";
import { GridLayer } from "./grid-layer";
import { RoomLayer } from "./room-layer";
import { WallLayer } from "./wall-layer";
import { OpeningLayer } from "./opening-layer";
import { FurnitureLayer } from "./furniture-layer";
import { CollaboratorCursors } from "../collaboration/collaborator-cursors";
import type { CollaboratorCursor } from "@/stores/collaboration-store";
import type { Opening, Wall } from "@/types";
import type Konva from "konva";

const nearestWall = (x: number, y: number, walls: Wall[], threshold: number) => {
  let best: { wall: Wall; dist: number } | null = null;
  for (const wall of walls) {
    const dist = distanceToWall(wall, x, y);
    if (dist < threshold && (!best || dist < best.dist)) best = { wall, dist };
  }
  return best?.wall ?? null;
};

const nearestOpening = (
  x: number,
  y: number,
  openings: Opening[],
  walls: Wall[],
  threshold: number,
) => {
  const wallMap = new Map(walls.map((w) => [w.id, w]));
  let best: { id: string; dist: number } | null = null;
  for (const opening of openings) {
    const wall = wallMap.get(opening.wall);
    if (!wall) continue;
    const [px, py] = pointOnWall(wall, opening.offset);
    const dist = Math.hypot(x - px, y - py);
    if (dist < threshold && (!best || dist < best.dist)) best = { id: opening.id, dist };
  }
  return best?.id ?? null;
};

interface EditorCanvasProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageRef: React.RefObject<Konva.Stage | null>;
  onCursorMove?: (x: number, y: number) => void;
  collaborators?: CollaboratorCursor[];
}

export const EditorCanvas = ({
  containerRef,
  stageRef,
  onCursorMove,
  collaborators,
}: EditorCanvasProps) => {
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const mousePosRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const wallLayerRedrawRef = useRef<() => void>(null);
  const openingPriorityRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTouchDistRef = useRef(0);
  const lastTouchCenterRef = useRef({ x: 0, y: 0 });
  const isTouchPanningRef = useRef(false);

  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const scale = zoom * PX_PER_MM;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  // Pointer position in millimetres.
  const getCanvasPoint = useCallback((stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const s = useEditorStore.getState();
    const k = s.zoom * PX_PER_MM;
    return { x: (pointer.x - s.panX) / k, y: (pointer.y - s.panY) / k };
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      const pointer = stage?.getPointerPosition();
      if (!stage || !pointer) return;

      const s = useEditorStore.getState();
      const oldZoom = s.zoom;
      const newZoom = Math.max(
        0.1,
        Math.min(5, e.evt.deltaY > 0 ? oldZoom / 1.08 : oldZoom * 1.08),
      );
      const oldK = oldZoom * PX_PER_MM;
      const newK = newZoom * PX_PER_MM;
      const anchor = { x: (pointer.x - s.panX) / oldK, y: (pointer.y - s.panY) / oldK };

      s.setZoom(newZoom);
      s.setPan(pointer.x - anchor.x * newK, pointer.y - anchor.y * newK);
    },
    [stageRef],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = useEditorStore.getState();
      const threshold = 20 / (s.zoom * PX_PER_MM);

      if (e.evt.button === 1 || s.activeTool === "pan") {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        stage.container().style.cursor = "grabbing";
        return;
      }

      if (!s.canEdit && s.activeTool !== "select") return;

      const point = getCanvasPoint(stage);
      if (!point) return;

      if (s.activeTool === "wall") {
        const snapped = s.snapPoint(point);
        if (!s.isDrawing) {
          s.setIsDrawing(true);
          s.setCurrentWallStart(snapped);
        } else if (s.currentWallStart) {
          const length = Math.hypot(
            snapped.x - s.currentWallStart.x,
            snapped.y - s.currentWallStart.y,
          );
          if (length > 50) {
            s.addWall({
              id: newId(),
              from: toVec(s.currentWallStart),
              to: toVec(snapped),
              thickness: DEFAULTS.wallThickness,
              height: DEFAULTS.wallHeight,
            });
          }
          s.setCurrentWallStart(snapped);
        }
        return;
      }

      if (s.activeTool === "door" || s.activeTool === "window") {
        const wall = nearestWall(point.x, point.y, s.walls, threshold);
        if (!wall) return;
        const kind = s.activeTool;
        const spec = kind === "door" ? DEFAULTS.door : DEFAULTS.window;
        const id = newId();
        s.addOpening({
          id,
          kind,
          wall: wall.id,
          offset: clampOpeningOffset(spec, wall, offsetAlongWall(wall, point.x, point.y)),
          width: spec.width,
          height: spec.height,
          ...(kind === "door"
            ? { variant: "single", hinge: "left", swing: "in" }
            : { sill: DEFAULTS.window.sill }),
        });
        s.setTool("select");
        s.setSelectedElement(id);
        return;
      }

      if (s.activeTool === "eraser") {
        const openingId = nearestOpening(point.x, point.y, s.openings, s.walls, threshold);
        if (openingId) return s.removeOpening(openingId);

        const wall = s.walls.find(
          (w) => distanceToWall(w, point.x, point.y) < w.thickness / 2 + threshold / 2,
        );
        if (wall) return s.removeWall(wall.id);

        const piece = s.furniture.find((f) => {
          const [w, d] = furnitureSize(f, s.catalog);
          const rad = (f.rotation * Math.PI) / 180;
          const dx = point.x - f.at[0];
          const dy = point.y - f.at[1];
          const localX = dx * Math.cos(rad) + dy * Math.sin(rad);
          const localY = -dx * Math.sin(rad) + dy * Math.cos(rad);
          return Math.abs(localX) <= w / 2 && Math.abs(localY) <= d / 2;
        });
        if (piece) s.removeFurniture(piece.id);
        return;
      }

      if (s.activeTool === "select") {
        const openingId = nearestOpening(point.x, point.y, s.openings, s.walls, threshold);
        if (openingId) {
          openingPriorityRef.current = true;
          s.setSelectedElement(openingId);
          return;
        }
        openingPriorityRef.current = false;
        if (e.target === stage || e.target.getParent() === stage) s.clearSelection();
      }
    },
    [getCanvasPoint, stageRef],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = useEditorStore.getState();

      if (isPanningRef.current) {
        const dx = e.evt.clientX - lastPanPosRef.current.x;
        const dy = e.evt.clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        s.setPan(s.panX + dx, s.panY + dy);
        return;
      }

      const point = getCanvasPoint(stage);
      if (point) {
        mousePosRef.current = point;
        onCursorMove?.(point.x, point.y);
        if (s.activeTool === "wall" && s.isDrawing) {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => wallLayerRedrawRef.current?.());
        }
      }

      const cursor =
        s.activeTool === "pan"
          ? isPanningRef.current
            ? "grabbing"
            : "grab"
          : s.activeTool === "eraser"
            ? "not-allowed"
            : s.activeTool === "select"
              ? "default"
              : "crosshair";
      stage.container().style.cursor = cursor;
    },
    [getCanvasPoint, stageRef, onCursorMove],
  );

  const handleMouseUp = useCallback(() => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    const stage = stageRef.current;
    if (stage) {
      stage.container().style.cursor =
        useEditorStore.getState().activeTool === "pan" ? "grab" : "default";
    }
  }, [stageRef]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const stopDrawing = useCallback(() => {
    const s = useEditorStore.getState();
    if (s.activeTool === "wall" && s.isDrawing) {
      s.setIsDrawing(false);
      s.setCurrentWallStart(null);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const s = useEditorStore.getState();
      if (s.isDrawing) {
        s.setIsDrawing(false);
        s.setCurrentWallStart(null);
      } else {
        s.clearSelection();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dist = (t1: Touch, t2: Touch) =>
      Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    const center = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      isTouchPanningRef.current = true;
      lastTouchDistRef.current = dist(e.touches[0], e.touches[1]);
      lastTouchCenterRef.current = center(e.touches[0], e.touches[1]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !isTouchPanningRef.current) return;
      e.preventDefault();
      const s = useEditorStore.getState();
      const newDist = dist(e.touches[0], e.touches[1]);
      const newCenter = center(e.touches[0], e.touches[1]);
      const newZoom = Math.max(
        0.1,
        Math.min(5, s.zoom * (newDist / (lastTouchDistRef.current || 1))),
      );

      const rect = container.getBoundingClientRect();
      const cx = newCenter.x - rect.left;
      const cy = newCenter.y - rect.top;
      const oldK = s.zoom * PX_PER_MM;
      const newK = newZoom * PX_PER_MM;
      const anchor = { x: (cx - s.panX) / oldK, y: (cy - s.panY) / oldK };
      const dx = newCenter.x - lastTouchCenterRef.current.x;
      const dy = newCenter.y - lastTouchCenterRef.current.y;

      s.setZoom(newZoom);
      s.setPan(cx - anchor.x * newK + dx, cy - anchor.y * newK + dy);
      lastTouchDistRef.current = newDist;
      lastTouchCenterRef.current = newCenter;
    };

    const handleTouchEnd = () => {
      isTouchPanningRef.current = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef]);

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={scale}
      scaleY={scale}
      x={panX}
      y={panY}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={stopDrawing}
      onContextMenu={(e) => e.evt.preventDefault()}
    >
      <GridLayer width={stageSize.width} height={stageSize.height} />
      <RoomLayer />
      <WallLayer
        mousePosRef={mousePosRef}
        redrawRef={wallLayerRedrawRef}
        openingPriorityRef={openingPriorityRef}
      />
      <OpeningLayer />
      <FurnitureLayer />
      {collaborators && collaborators.length > 0 && (
        <CollaboratorCursors collaborators={collaborators} />
      )}
      <Layer listening={false}>
        <Rect x={0} y={0} width={0} height={0} listening={false} />
      </Layer>
    </Stage>
  );
};
