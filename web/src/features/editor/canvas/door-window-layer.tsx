"use client";

import { useRef, useEffect, useCallback } from "react";
import { Layer, Shape, Line, Rect, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import type { Wall } from "@/types";
import type Konva from "konva";

const getWallAngle = (wall: Wall) => {
  return Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
};

const getPointOnWall = (wall: Wall, position: number) => {
  return {
    x: wall.x1 + (wall.x2 - wall.x1) * position,
    y: wall.y1 + (wall.y2 - wall.y1) * position,
  };
};

const projectOntoWall = (wall: Wall, x: number, y: number): number => {
  const dx = wall.x2 - wall.x1;
  const dy = wall.y2 - wall.y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return 0.5;
  return Math.max(0.05, Math.min(0.95, ((x - wall.x1) * dx + (y - wall.y1) * dy) / lenSq));
};

export const DoorWindowLayer = () => {
  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const zoom = useEditorStore((s) => s.zoom);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const updateDoor = useEditorStore((s) => s.updateDoor);
  const updateWindow = useEditorStore((s) => s.updateWindow);

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const wallMap = new Map(walls.map((w) => [w.id, w]));

  const setShapeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      shapeRefs.current.set(id, node);
    } else {
      shapeRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedElementId) {
      const node = shapeRefs.current.get(selectedElementId);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
        return;
      }
    }
    transformer.nodes([]);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, doors, windows]);

  return (
    <Layer>
      {doors.map((door) => {
        const wall = wallMap.get(door.wallId);
        if (!wall) return null;

        const pos = getPointOnWall(wall, door.position);
        const wallAngle = getWallAngle(wall);
        const angleDeg = (wallAngle * 180) / Math.PI;
        const halfWidth = door.width / 2;
        const isSelected = selectedElementId === door.id;
        const fh = !!door.flipHinge;
        const fs = !!door.flipSwing;
        const hingeX = fh ? halfWidth : -halfWidth;
        const singleArcRotation = fh ? (fs ? 90 : 180) : fs ? 0 : -90;

        return (
          <Group
            key={door.id}
            ref={(node) => setShapeRef(door.id, node)}
            x={pos.x}
            y={pos.y}
            rotation={angleDeg}
            draggable={activeTool === "select"}
            onClick={() => {
              if (activeTool === "select") setSelectedElement(door.id);
            }}
            onTap={() => {
              if (activeTool === "select") setSelectedElement(door.id);
            }}
            onDragEnd={(e) => {
              const newPos = projectOntoWall(wall, e.target.x(), e.target.y());
              updateDoor(door.id, { position: newPos });
              const snapped = getPointOnWall(wall, newPos);
              e.target.position({ x: snapped.x, y: snapped.y });
              e.target.rotation(angleDeg);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const scaleX = Math.abs(node.scaleX());
              const newWidth = Math.max(30, Math.min(200, Math.round(door.width * scaleX)));
              const newPos = projectOntoWall(wall, node.x(), node.y());
              updateDoor(door.id, { width: newWidth, position: newPos });
              node.scaleX(1);
              node.scaleY(1);
              const snapped = getPointOnWall(wall, newPos);
              node.position({ x: snapped.x, y: snapped.y });
              node.rotation(angleDeg);
            }}
          >
            <Line
              points={[-halfWidth, 0, halfWidth, 0]}
              stroke="#0C0C0C"
              strokeWidth={wall.thickness + 4}
              listening={false}
            />
            <Rect
              x={-halfWidth}
              y={-wall.thickness * 0.3}
              width={door.width}
              height={wall.thickness * 0.6}
              fill="#8B7355"
              stroke={isSelected ? "#D4A853" : undefined}
              strokeWidth={isSelected ? 2 / zoom : 0}
              shadowColor={isSelected ? "#D4A853" : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowOpacity={isSelected ? 0.4 : 0}
            />
            <Line
              points={[-halfWidth, -wall.thickness * 0.3, -halfWidth, wall.thickness * 0.3]}
              stroke="#6B5344"
              strokeWidth={2 / zoom}
              listening={false}
            />
            <Line
              points={[halfWidth, -wall.thickness * 0.3, halfWidth, wall.thickness * 0.3]}
              stroke="#6B5344"
              strokeWidth={2 / zoom}
              listening={false}
            />
            {door.type === "single" && (
              <Shape
                sceneFunc={(ctx, shape) => {
                  const startRad = (singleArcRotation * Math.PI) / 180;
                  const endRad = startRad + Math.PI / 2;
                  ctx.beginPath();
                  ctx.moveTo(hingeX, 0);
                  ctx.arc(hingeX, 0, door.width, startRad, endRad, false);
                  ctx.closePath();
                  ctx.fillStrokeShape(shape);
                }}
                stroke="#C4B99A"
                strokeWidth={1.5 / zoom}
                dash={[4 / zoom, 3 / zoom]}
                listening={false}
              />
            )}
            {door.type === "double" && (
              <>
                <Shape
                  sceneFunc={(ctx, shape) => {
                    const startRad = ((fs ? 0 : -90) * Math.PI) / 180;
                    const endRad = startRad + Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(-halfWidth, 0);
                    ctx.arc(-halfWidth, 0, halfWidth, startRad, endRad, false);
                    ctx.closePath();
                    ctx.fillStrokeShape(shape);
                  }}
                  stroke="#C4B99A"
                  strokeWidth={1.5 / zoom}
                  dash={[4 / zoom, 3 / zoom]}
                  listening={false}
                />
                <Shape
                  sceneFunc={(ctx, shape) => {
                    const startRad = ((fs ? 90 : 180) * Math.PI) / 180;
                    const endRad = startRad + Math.PI / 2;
                    ctx.beginPath();
                    ctx.moveTo(halfWidth, 0);
                    ctx.arc(halfWidth, 0, halfWidth, startRad, endRad, false);
                    ctx.closePath();
                    ctx.fillStrokeShape(shape);
                  }}
                  stroke="#C4B99A"
                  strokeWidth={1.5 / zoom}
                  dash={[4 / zoom, 3 / zoom]}
                  listening={false}
                />
              </>
            )}
          </Group>
        );
      })}

      {windows.map((win) => {
        const wall = wallMap.get(win.wallId);
        if (!wall) return null;

        const pos = getPointOnWall(wall, win.position);
        const wallAngle = getWallAngle(wall);
        const angleDeg = (wallAngle * 180) / Math.PI;
        const halfWidth = win.width / 2;
        const t = wall.thickness * 0.4;
        const isSelected = selectedElementId === win.id;

        return (
          <Group
            key={win.id}
            ref={(node) => setShapeRef(win.id, node)}
            x={pos.x}
            y={pos.y}
            rotation={angleDeg}
            draggable={activeTool === "select"}
            onClick={() => {
              if (activeTool === "select") setSelectedElement(win.id);
            }}
            onTap={() => {
              if (activeTool === "select") setSelectedElement(win.id);
            }}
            onDragEnd={(e) => {
              const newPos = projectOntoWall(wall, e.target.x(), e.target.y());
              updateWindow(win.id, { position: newPos });
              const snapped = getPointOnWall(wall, newPos);
              e.target.position({ x: snapped.x, y: snapped.y });
              e.target.rotation(angleDeg);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const scaleX = Math.abs(node.scaleX());
              const newWidth = Math.max(20, Math.min(150, Math.round(win.width * scaleX)));
              const newPos = projectOntoWall(wall, node.x(), node.y());
              updateWindow(win.id, { width: newWidth, position: newPos });
              node.scaleX(1);
              node.scaleY(1);
              const snapped = getPointOnWall(wall, newPos);
              node.position({ x: snapped.x, y: snapped.y });
              node.rotation(angleDeg);
            }}
          >
            <Line
              points={[-halfWidth, 0, halfWidth, 0]}
              stroke="#0C0C0C"
              strokeWidth={wall.thickness + 2}
              listening={false}
            />
            <Rect
              x={-halfWidth}
              y={-t}
              width={win.width}
              height={t * 2}
              fill="#87CEEB"
              opacity={0.4}
              stroke={isSelected ? "#D4A853" : undefined}
              strokeWidth={isSelected ? 2 / zoom : 0}
              shadowColor={isSelected ? "#D4A853" : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowOpacity={isSelected ? 0.4 : 0}
            />
            <Line
              points={[-halfWidth, -t, halfWidth, -t]}
              stroke="#87CEEB"
              strokeWidth={1.5 / zoom}
              listening={false}
            />
            <Line
              points={[-halfWidth, t, halfWidth, t]}
              stroke="#87CEEB"
              strokeWidth={1.5 / zoom}
              listening={false}
            />
            <Line
              points={[-halfWidth, -t, -halfWidth, t]}
              stroke="#87CEEB"
              strokeWidth={1.5 / zoom}
              listening={false}
            />
            <Line
              points={[halfWidth, -t, halfWidth, t]}
              stroke="#87CEEB"
              strokeWidth={1.5 / zoom}
              listening={false}
            />
            <Line
              points={[0, -t, 0, t]}
              stroke="#87CEEB"
              strokeWidth={1 / zoom}
              listening={false}
            />
          </Group>
        );
      })}

      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        enabledAnchors={["middle-left", "middle-right"]}
        borderStroke="#D4A853"
        borderStrokeWidth={2}
        anchorFill="#D4A853"
        anchorStroke="#0C0C0C"
        anchorSize={10}
        anchorCornerRadius={2}
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 20) return oldBox;
          return newBox;
        }}
      />
    </Layer>
  );
};
