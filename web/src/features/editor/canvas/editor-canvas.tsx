"use client";

import { memo, useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";
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
import { applyGrid, type View } from "./grid";
import { RoomShapes, RoomLabels } from "./room-layer";
import { WallShapes, WallPreview, type PointerState } from "./wall-layer";
import { OpeningShapes } from "./opening-layer";
import { FurnitureShapes } from "./furniture-layer";
import { CollaboratorCursors } from "../collaboration/collaborator-cursors";
import { isTypingTarget } from "../keyboard-shortcuts";
import type { EditorTool, Opening, Wall } from "@/types";
import type Konva from "konva";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;
const COMMIT_IDLE_MS = 120;
const WHEEL_STEP = 1.12;
const EASE = 0.3;

const clampZoom = (zoom: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));

const cursorForTool = (tool: EditorTool) =>
  tool === "pan"
    ? "grab"
    : tool === "eraser"
      ? "not-allowed"
      : tool === "select"
        ? "default"
        : "crosshair";

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
}

export const EditorCanvas = memo(function EditorCanvas({
  containerRef,
  stageRef,
  onCursorMove,
}: EditorCanvasProps) {
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const overlayRef = useRef<Konva.Layer | null>(null);
  const pointerRef = useRef<PointerState | null>(null);
  const isPanningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const openingPriorityRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTouchDistRef = useRef(0);
  const lastTouchCenterRef = useRef({ x: 0, y: 0 });
  const isTouchPanningRef = useRef(false);
  const viewRef = useRef<View>({ zoom: 1, panX: 0, panY: 0 });
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<{ target: View; frame: number } | null>(null);

  const setCursor = useCallback(
    (cursor: string) => stageRef.current?.container().style.setProperty("cursor", cursor),
    [stageRef],
  );

  const paintGrid = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const s = useEditorStore.getState();
    applyGrid(el, viewRef.current, s.gridSize, PX_PER_MM, s.showGrid);
  }, [containerRef]);

  const applyView = useCallback(
    (view: View) => {
      viewRef.current = view;
      const stage = stageRef.current;
      if (stage) {
        const k = view.zoom * PX_PER_MM;
        stage.scale({ x: k, y: k });
        stage.position({ x: view.panX, y: view.panY });
        stage.batchDraw();
      }
      paintGrid();
    },
    [stageRef, paintGrid],
  );

  const scheduleCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      useEditorStore.getState().setView(viewRef.current);
    }, COMMIT_IDLE_MS);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current.frame);
    animRef.current = null;
  }, []);

  const animateTo = useCallback(
    (target: View) => {
      if (animRef.current) {
        animRef.current.target = target;
        return;
      }
      const step = () => {
        const anim = animRef.current;
        if (!anim) return;
        const v = viewRef.current;
        const t = anim.target;
        const settled =
          Math.abs(t.zoom - v.zoom) < t.zoom * 0.001 &&
          Math.abs(t.panX - v.panX) < 0.5 &&
          Math.abs(t.panY - v.panY) < 0.5;
        if (settled) {
          animRef.current = null;
          applyView(t);
          scheduleCommit();
          return;
        }
        applyView({
          zoom: v.zoom + (t.zoom - v.zoom) * EASE,
          panX: v.panX + (t.panX - v.panX) * EASE,
          panY: v.panY + (t.panY - v.panY) * EASE,
        });
        anim.frame = requestAnimationFrame(step);
      };
      animRef.current = { target, frame: requestAnimationFrame(step) };
    },
    [applyView, scheduleCommit],
  );

  useEffect(() => {
    const sync = (animate: boolean) => {
      const s = useEditorStore.getState();
      const v = animRef.current?.target ?? viewRef.current;
      if (s.zoom !== v.zoom || s.panX !== v.panX || s.panY !== v.panY) {
        const target = { zoom: s.zoom, panX: s.panX, panY: s.panY };
        if (animate) animateTo(target);
        else applyView(target);
      } else {
        paintGrid();
      }
    };
    sync(false);
    return useEditorStore.subscribe((state, prev) => {
      if (
        state.zoom !== prev.zoom ||
        state.panX !== prev.panX ||
        state.panY !== prev.panY ||
        state.gridSize !== prev.gridSize ||
        state.showGrid !== prev.showGrid
      ) {
        sync(true);
      }
    });
  }, [applyView, animateTo, paintGrid]);

  useEffect(() => {
    const updateSize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setStageSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      stopAnimation();
    };
  }, [containerRef, stopAnimation]);

  const canvasPoint = useCallback((stage: Konva.Stage) => {
    const p = stage.getRelativePointerPosition();
    return p ? { x: p.x, y: p.y } : null;
  }, []);

  const zoomAround = useCallback(
    (screenX: number, screenY: number, factor: number) => {
      const v = viewRef.current;
      const zoom = clampZoom((animRef.current?.target.zoom ?? v.zoom) * factor);
      const oldK = v.zoom * PX_PER_MM;
      const newK = zoom * PX_PER_MM;
      const anchorX = (screenX - v.panX) / oldK;
      const anchorY = (screenY - v.panY) / oldK;
      animateTo({ zoom, panX: screenX - anchorX * newK, panY: screenY - anchorY * newK });
    },
    [animateTo],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      zoomAround(pointer.x, pointer.y, e.evt.deltaY > 0 ? 1 / WHEEL_STEP : WHEEL_STEP);
    },
    [stageRef, zoomAround],
  );

  const redrawPreview = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => overlayRef.current?.batchDraw());
  }, []);

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = useEditorStore.getState();
      const threshold = 20 / (viewRef.current.zoom * PX_PER_MM);

      if (e.evt.button === 1 || s.activeTool === "pan" || spaceHeldRef.current) {
        stopAnimation();
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        setCursor("grabbing");
        return;
      }

      if (!s.canEdit && s.activeTool !== "select") return;

      const point = canvasPoint(stage);
      if (!point) return;

      if (s.activeTool === "wall") {
        const { point: snapped } = s.snapWallPoint(point, { shift: e.evt.shiftKey });
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
    [canvasPoint, stageRef, setCursor, stopAnimation],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (isPanningRef.current) {
        const dx = e.evt.clientX - lastPanPosRef.current.x;
        const dy = e.evt.clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        const v = viewRef.current;
        applyView({ ...v, panX: v.panX + dx, panY: v.panY + dy });
        scheduleCommit();
        return;
      }

      const point = canvasPoint(stage);
      if (point) {
        pointerRef.current = { ...point, shift: e.evt.shiftKey };
        onCursorMove?.(point.x, point.y);
        const s = useEditorStore.getState();
        if (s.activeTool === "wall" && s.isDrawing) redrawPreview();
      }
    },
    [canvasPoint, stageRef, onCursorMove, applyView, scheduleCommit, redrawPreview],
  );

  const restCursor = useCallback(() => {
    setCursor(spaceHeldRef.current ? "grab" : cursorForTool(useEditorStore.getState().activeTool));
  }, [setCursor]);

  const handleMouseUp = useCallback(() => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    restCursor();
  }, [restCursor]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const activeTool = useEditorStore((s) => s.activeTool);
  useEffect(() => {
    setCursor(cursorForTool(activeTool));
  }, [activeTool, setCursor]);

  const stopDrawing = useCallback(() => {
    const s = useEditorStore.getState();
    if (s.activeTool === "wall" && s.isDrawing) {
      s.setIsDrawing(false);
      s.setCurrentWallStart(null);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!e.repeat) {
          spaceHeldRef.current = true;
          if (!isPanningRef.current) setCursor("grab");
        }
        return;
      }
      if (e.key === "Shift" && pointerRef.current) {
        pointerRef.current = { ...pointerRef.current, shift: true };
        redrawPreview();
        return;
      }
      if (e.key !== "Escape") return;
      const s = useEditorStore.getState();
      if (s.isDrawing) {
        s.setIsDrawing(false);
        s.setCurrentWallStart(null);
      } else {
        s.clearSelection();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceHeldRef.current = false;
        if (!isPanningRef.current) restCursor();
      } else if (e.key === "Shift" && pointerRef.current) {
        pointerRef.current = { ...pointerRef.current, shift: false };
        redrawPreview();
      }
    };
    const handleBlur = () => {
      spaceHeldRef.current = false;
      if (!isPanningRef.current) restCursor();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [setCursor, restCursor, redrawPreview]);

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
      stopAnimation();
      isTouchPanningRef.current = true;
      lastTouchDistRef.current = dist(e.touches[0], e.touches[1]);
      lastTouchCenterRef.current = center(e.touches[0], e.touches[1]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !isTouchPanningRef.current) return;
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const newDist = dist(e.touches[0], e.touches[1]);
      const newCenter = center(e.touches[0], e.touches[1]);
      const v = viewRef.current;
      const zoom = clampZoom(v.zoom * (newDist / (lastTouchDistRef.current || 1)));
      const oldK = v.zoom * PX_PER_MM;
      const newK = zoom * PX_PER_MM;
      const sx = newCenter.x - rect.left;
      const sy = newCenter.y - rect.top;
      const anchorX = (sx - v.panX) / oldK;
      const anchorY = (sy - v.panY) / oldK;
      applyView({
        zoom,
        panX: sx - anchorX * newK + (newCenter.x - lastTouchCenterRef.current.x),
        panY: sy - anchorY * newK + (newCenter.y - lastTouchCenterRef.current.y),
      });
      scheduleCommit();
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
  }, [containerRef, applyView, scheduleCommit, stopAnimation]);

  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const k = zoom * PX_PER_MM;
  useEffect(() => {
    applyView(viewRef.current);
  });

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      scaleX={k}
      scaleY={k}
      x={panX}
      y={panY}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={stopDrawing}
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
});
