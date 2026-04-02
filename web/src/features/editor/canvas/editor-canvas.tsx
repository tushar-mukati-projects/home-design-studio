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

  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  const activeTool = useEditorStore((s) => s.activeTool);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const currentWallStart = useEditorStore((s) => s.currentWallStart);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const setIsDrawing = useEditorStore((s) => s.setIsDrawing);
  const setCurrentWallStart = useEditorStore((s) => s.setCurrentWallStart);
  const addWall = useEditorStore((s) => s.addWall);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const snapPoint = useEditorStore((s) => s.snapPoint);
  const removeWall = useEditorStore((s) => s.removeWall);
  const removeFurniture = useEditorStore((s) => s.removeFurniture);
  const addDoor = useEditorStore((s) => s.addDoor);
  const addWindow = useEditorStore((s) => s.addWindow);
  const removeDoor = useEditorStore((s) => s.removeDoor);
  const removeWindow = useEditorStore((s) => s.removeWindow);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const setTool = useEditorStore((s) => s.setTool);
  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const furniture = useEditorStore((s) => s.furniture);

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
    return () => observer.disconnect();
  }, [containerRef]);

  const getCanvasPoint = useCallback(
    (stage: Konva.Stage) => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return null;
      return {
        x: (pointer.x - panX) / zoom,
        y: (pointer.y - panY) / zoom,
      };
    },
    [panX, panY, zoom],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const scaleBy = 1.08;
      const oldZoom = zoom;
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newZoom = direction > 0 ? oldZoom * scaleBy : oldZoom / scaleBy;
      const clampedZoom = Math.max(0.1, Math.min(5, newZoom));

      const mousePointTo = {
        x: (pointer.x - panX) / oldZoom,
        y: (pointer.y - panY) / oldZoom,
      };

      const newPanX = pointer.x - mousePointTo.x * clampedZoom;
      const newPanY = pointer.y - mousePointTo.y * clampedZoom;

      setZoom(clampedZoom);
      setPan(newPanX, newPanY);
    },
    [zoom, panX, panY, setZoom, setPan, stageRef],
  );

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (e.evt.button === 1 || activeTool === "pan") {
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        stage.container().style.cursor = "grabbing";
        return;
      }

      if (activeTool === "wall") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const snapped = snapPoint(point);

        if (!isDrawing) {
          setIsDrawing(true);
          setCurrentWallStart(snapped);
        } else if (currentWallStart) {
          const wallLength = Math.sqrt(
            (snapped.x - currentWallStart.x) ** 2 + (snapped.y - currentWallStart.y) ** 2,
          );
          if (wallLength > 5) {
            addWall({
              id: crypto.randomUUID(),
              x1: currentWallStart.x,
              y1: currentWallStart.y,
              x2: snapped.x,
              y2: snapped.y,
              thickness: 8,
              color: "#6B5B4D",
            });
          }
          setCurrentWallStart(snapped);
        }
        return;
      }

      if (activeTool === "door") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const result = findNearestWall(point.x, point.y, walls, 20 / zoom);
        if (result) {
          const id = crypto.randomUUID();
          addDoor({
            id,
            wallId: result.wall.id,
            position: result.position,
            width: 80,
            type: "single",
          });
          setTool("select");
          setSelectedElement(id);
        }
        return;
      }

      if (activeTool === "window") {
        const point = getCanvasPoint(stage);
        if (!point) return;
        const result = findNearestWall(point.x, point.y, walls, 20 / zoom);
        if (result) {
          const id = crypto.randomUUID();
          addWindow({
            id,
            wallId: result.wall.id,
            position: result.position,
            width: 60,
          });
          setTool("select");
          setSelectedElement(id);
        }
        return;
      }

      if (activeTool === "eraser") {
        const point = getCanvasPoint(stage);
        if (!point) return;

        const hitDoorOrWindow = findNearestDoorOrWindow(
          point.x,
          point.y,
          doors,
          windows,
          walls,
          20 / zoom,
        );
        if (hitDoorOrWindow) {
          if (hitDoorOrWindow.kind === "door") removeDoor(hitDoorOrWindow.id);
          else removeWindow(hitDoorOrWindow.id);
          return;
        }

        const hitWall = walls.find((wall) => {
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
          return dist < wall.thickness / 2 + 10 / zoom;
        });

        if (hitWall) {
          removeWall(hitWall.id);
          return;
        }

        const hitFurniture = furniture.find((f) => {
          const hw = (f.furnitureItem.width * f.scaleX) / 2;
          const hh = (f.furnitureItem.height * f.scaleY) / 2;
          return (
            point.x >= f.x - hw && point.x <= f.x + hw && point.y >= f.y - hh && point.y <= f.y + hh
          );
        });

        if (hitFurniture) {
          removeFurniture(hitFurniture.id);
          return;
        }
        return;
      }

      if (activeTool === "select") {
        const point = getCanvasPoint(stage);
        if (point) {
          const hitDoorOrWindow = findNearestDoorOrWindow(
            point.x,
            point.y,
            doors,
            windows,
            walls,
            20 / zoom,
          );
          if (hitDoorOrWindow) {
            doorWindowPriorityRef.current = true;
            setSelectedElement(hitDoorOrWindow.id);
            return;
          }
        }
        doorWindowPriorityRef.current = false;

        const clickedOnEmpty = e.target === stage || e.target.getParent() === stage;
        if (clickedOnEmpty) {
          clearSelection();
        }
      }
    },
    [
      activeTool,
      isDrawing,
      currentWallStart,
      getCanvasPoint,
      snapPoint,
      setIsDrawing,
      setCurrentWallStart,
      addWall,
      addDoor,
      addWindow,
      clearSelection,
      setSelectedElement,
      setTool,
      removeWall,
      removeFurniture,
      removeDoor,
      removeWindow,
      walls,
      doors,
      windows,
      furniture,
      zoom,
      stageRef,
    ],
  );

  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      if (isPanningRef.current) {
        const dx = e.evt.clientX - lastPanPosRef.current.x;
        const dy = e.evt.clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        setPan(panX + dx, panY + dy);
        return;
      }

      const point = getCanvasPoint(stage);
      if (point) {
        mousePosRef.current = point;
        onCursorMove?.(point.x, point.y);
        if (activeTool === "wall" && isDrawing) {
          wallLayerRedrawRef.current?.();
        }
      }

      if (activeTool === "wall" || activeTool === "door" || activeTool === "window") {
        stage.container().style.cursor = "crosshair";
      } else if (activeTool === "pan") {
        stage.container().style.cursor = isPanningRef.current ? "grabbing" : "grab";
      } else if (activeTool === "eraser") {
        stage.container().style.cursor = "not-allowed";
      } else {
        stage.container().style.cursor = "default";
      }
    },
    [activeTool, isDrawing, getCanvasPoint, panX, panY, setPan, stageRef, onCursorMove],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      const stage = stageRef.current;
      if (stage) {
        stage.container().style.cursor = activeTool === "pan" ? "grab" : "default";
      }
    }
  }, [activeTool, stageRef]);

  const handleDblClick = useCallback(() => {
    if (activeTool === "wall" && isDrawing) {
      setIsDrawing(false);
      setCurrentWallStart(null);
    }
  }, [activeTool, isDrawing, setIsDrawing, setCurrentWallStart]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isDrawing) {
          setIsDrawing(false);
          setCurrentWallStart(null);
        } else {
          clearSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawing, setIsDrawing, setCurrentWallStart, clearSelection]);

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
