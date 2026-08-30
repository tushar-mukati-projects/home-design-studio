"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Stage, Layer, Rect } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { GridLayer } from "./grid-layer";
import { RoomLayer } from "./room-layer";
import { WallLayer } from "./wall-layer";
import { DoorWindowLayer } from "./door-window-layer";
import { FurnitureLayer } from "./furniture-layer";
import { CollaboratorCursors } from "../collaboration/collaborator-cursors";
import type { CollaboratorCursor } from "@/stores/collaboration-store";
import type { Wall } from "@/types";
import type Konva from "konva";

const findNearestWall = (
  x: number,
  y: number,
  wallList: Wall[],
  threshold: number,
): { wall: Wall; position: number } | null => {
  let closest: { wall: Wall; position: number; dist: number } | null = null;

  for (const wall of wallList) {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) continue;

    const t = Math.max(0, Math.min(1, ((x - wall.x1) * dx + (y - wall.y1) * dy) / lenSq));
    const projX = wall.x1 + t * dx;
    const projY = wall.y1 + t * dy;
    const dist = Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);

    if (dist < threshold && (!closest || dist < closest.dist)) {
      closest = { wall, position: t, dist };
    }
  }

  return closest ? { wall: closest.wall, position: closest.position } : null;
};

const findNearestDoorOrWindow = (
  x: number,
  y: number,
  doorList: { id: string; wallId: string; position: number; width: number }[],
  windowList: { id: string; wallId: string; position: number; width: number }[],
  wallList: Wall[],
  threshold: number,
): { id: string; kind: "door" | "window" } | null => {
  const wallMap = new Map(wallList.map((w) => [w.id, w]));
  let best: { id: string; kind: "door" | "window"; dist: number } | null = null;

  for (const door of doorList) {
    const wall = wallMap.get(door.wallId);
    if (!wall) continue;
    const px = wall.x1 + (wall.x2 - wall.x1) * door.position;
    const py = wall.y1 + (wall.y2 - wall.y1) * door.position;
    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    if (dist < threshold && (!best || dist < best.dist)) {
      best = { id: door.id, kind: "door", dist };
    }
  }

  for (const win of windowList) {
    const wall = wallMap.get(win.wallId);
    if (!wall) continue;
    const px = wall.x1 + (wall.x2 - wall.x1) * win.position;
    const py = wall.y1 + (wall.y2 - wall.y1) * win.position;
    const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
    if (dist < threshold && (!best || dist < best.dist)) {
      best = { id: win.id, kind: "window", dist };
    }
  }

  return best ? { id: best.id, kind: best.kind } : null;
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
  const doorWindowPriorityRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastTouchDistRef = useRef(0);
  const lastTouchCenterRef = useRef({ x: 0, y: 0 });
  const isTouchPanningRef = useRef(false);

  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef]);

  const getCanvasPoint = useCallback((stage: Konva.Stage) => {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    const s = useEditorStore.getState();
    return {
      x: (pointer.x - s.panX) / s.zoom,
      y: (pointer.y - s.panY) / s.zoom,
    };
  }, []);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const s = useEditorStore.getState();
      const scaleBy = 1.08;
      const oldZoom = s.zoom;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
      const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

      const mousePointTo = {
        x: (pointer.x - s.panX) / oldZoom,
        y: (pointer.y - s.panY) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * clampedZoom;
      const newPanY = pointer.y - mousePointTo.y * clampedZoom;

      s.setZoom(clampedZoom);
      s.setPan(newPanX, newPanY);
    },
    [stageRef],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = useEditorStore.getState();

      if (e.evt.button === 1 || s.activeTool === "pan") {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        stage.container().style.cursor = "grabbing";
        return;
      }

      if (!s.canEdit && s.activeTool !== "select") return;

      if (s.activeTool === "wall") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const snapped = s.snapPoint(point);

        if (!s.isDrawing) {
          s.setIsDrawing(true);
          s.setCurrentWallStart(snapped);
        } else if (s.currentWallStart) {
          const wallLength = Math.sqrt(
            (snapped.x - s.currentWallStart.x) ** 2 + (snapped.y - s.currentWallStart.y) ** 2,
          );
          if (wallLength > 5) {
            s.addWall({
              id: crypto.randomUUID(),
              x1: s.currentWallStart.x,
              y1: s.currentWallStart.y,
              x2: snapped.x,
              y2: snapped.y,
              thickness: 8,
              color: "#3a3a4a",
            });
          }
          s.setCurrentWallStart(snapped);
        }
        return;
      }

      if (s.activeTool === "door") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const result = findNearestWall(point.x, point.y, s.walls, 20 / s.zoom);
        if (result) {
          const id = crypto.randomUUID();
          s.addDoor({
            id,
            wallId: result.wall.id,
            position: result.position,
            width: 80,
            type: "single",
          });
          s.setTool("select");
          s.setSelectedElement(id);
        }
        return;
      }

      if (s.activeTool === "window") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const result = findNearestWall(point.x, point.y, s.walls, 20 / s.zoom);
        if (result) {
          const id = crypto.randomUUID();
          s.addWindow({
            id,
            wallId: result.wall.id,
            position: result.position,
            width: 60,
          });
          s.setTool("select");
          s.setSelectedElement(id);
        }
        return;
      }

      if (s.activeTool === "eraser") {
        if (!s.canEdit) return;
        const point = getCanvasPoint(stage);
        if (!point) return;

        const hitDoorOrWindow = findNearestDoorOrWindow(
          point.x,
          point.y,
          s.doors,
          s.windows,
          s.walls,
          20 / s.zoom,
        );
        if (hitDoorOrWindow) {
          if (hitDoorOrWindow.kind === "door") s.removeDoor(hitDoorOrWindow.id);
          else s.removeWindow(hitDoorOrWindow.id);
          return;
        }

        const hitWall = s.walls.find((wall) => {
          const dx = wall.x2 - wall.x1;
          const dy = wall.y2 - wall.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len === 0) return false;
          const t = Math.max(
            0,
            Math.min(1, ((point.x - wall.x1) * dx + (point.y - wall.y1) * dy) / (len * len)),
          );
          const projX = wall.x1 + t * dx;
          const projY = wall.y1 + t * dy;
          const dist = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
          return dist < wall.thickness / 2 + 10 / s.zoom;
        });

        if (hitWall) {
          s.removeWall(hitWall.id);
          return;
        }

        const hitFurniture = s.furniture.find((f) => {
          const hw = Math.abs(f.furnitureItem.width * f.scaleX) / 2;
          const hh = Math.abs(f.furnitureItem.height * f.scaleY) / 2;
          const rad = ((f.rotation || 0) * Math.PI) / 180;
          const dx = point.x - f.x;
          const dy = point.y - f.y;
          const localX = dx * Math.cos(rad) + dy * Math.sin(rad);
          const localY = -dx * Math.sin(rad) + dy * Math.cos(rad);
          return Math.abs(localX) <= hw && Math.abs(localY) <= hh;
        });

        if (hitFurniture) {
          s.removeFurniture(hitFurniture.id);
          return;
        }
        return;
      }

      if (s.activeTool === "select") {
        const point = getCanvasPoint(stage);
        if (point) {
          const hitDoorOrWindow = findNearestDoorOrWindow(
            point.x,
            point.y,
            s.doors,
            s.windows,
            s.walls,
            20 / s.zoom,
          );
          if (hitDoorOrWindow) {
            doorWindowPriorityRef.current = true;
            s.setSelectedElement(hitDoorOrWindow.id);
            return;
          }
        }
        doorWindowPriorityRef.current = false;

        const clickedOnEmpty = e.target === stage || e.target.getParent() === stage;
        if (clickedOnEmpty) {
          s.clearSelection();
        }
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
          rafRef.current = requestAnimationFrame(() => {
            wallLayerRedrawRef.current?.();
          });
        }
      }

      if (s.activeTool === "wall" || s.activeTool === "door" || s.activeTool === "window") {
        stage.container().style.cursor = "crosshair";
      } else if (s.activeTool === "pan") {
        stage.container().style.cursor = isPanningRef.current ? "grabbing" : "grab";
      } else if (s.activeTool === "eraser") {
        stage.container().style.cursor = "not-allowed";
      } else {
        stage.container().style.cursor = "default";
      }
    },
    [getCanvasPoint, stageRef, onCursorMove],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      const stage = stageRef.current;
      if (stage) {
        const s = useEditorStore.getState();
        stage.container().style.cursor = s.activeTool === "pan" ? "grab" : "default";
      }
    }
  }, [stageRef]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  const handleDblClick = useCallback(() => {
    const s = useEditorStore.getState();
    if (s.activeTool === "wall" && s.isDrawing) {
      s.setIsDrawing(false);
      s.setCurrentWallStart(null);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const s = useEditorStore.getState();
        if (s.isDrawing) {
          s.setIsDrawing(false);
          s.setCurrentWallStart(null);
        } else {
          s.clearSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const getTouchDistance = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (t1: Touch, t2: Touch) => ({
      x: (t1.clientX + t2.clientX) / 2,
      y: (t1.clientY + t2.clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isTouchPanningRef.current = true;
        lastTouchDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        lastTouchCenterRef.current = getTouchCenter(e.touches[0], e.touches[1]);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && isTouchPanningRef.current) {
        e.preventDefault();
        const s = useEditorStore.getState();

        const newDist = getTouchDistance(e.touches[0], e.touches[1]);
        const newCenter = getTouchCenter(e.touches[0], e.touches[1]);

        const scale = newDist / (lastTouchDistRef.current || 1);
        const newZoom = Math.max(0.1, Math.min(5, s.zoom * scale));

        const rect = container.getBoundingClientRect();
        const centerX = newCenter.x - rect.left;
        const centerY = newCenter.y - rect.top;
        const mousePointTo = {
          x: (centerX - s.panX) / s.zoom,
          y: (centerY - s.panY) / s.zoom,
        };

        const dx = newCenter.x - lastTouchCenterRef.current.x;
        const dy = newCenter.y - lastTouchCenterRef.current.y;

        const newPanX = centerX - mousePointTo.x * newZoom + dx;
        const newPanY = centerY - mousePointTo.y * newZoom + dy;

        s.setZoom(newZoom);
        s.setPan(newPanX, newPanY);

        lastTouchDistRef.current = newDist;
        lastTouchCenterRef.current = newCenter;
      }
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
      scaleX={zoom}
      scaleY={zoom}
      x={panX}
      y={panY}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDblClick={handleDblClick}
      onContextMenu={(e) => e.evt.preventDefault()}
    >
      <GridLayer width={stageSize.width} height={stageSize.height} />
      <RoomLayer />
      <WallLayer
        mousePosRef={mousePosRef}
        redrawRef={wallLayerRedrawRef}
        doorWindowPriorityRef={doorWindowPriorityRef}
      />
      <DoorWindowLayer />
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
