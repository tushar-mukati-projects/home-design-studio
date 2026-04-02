"use client";

import { memo, useRef, useCallback, useEffect, useState } from "react";
import { Layer, Line, Circle, Text, Group, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";

interface WallLayerProps {
  mousePosRef: React.RefObject<{ x: number; y: number } | null>;
  redrawRef: React.MutableRefObject<(() => void) | null>;
  doorWindowPriorityRef: React.RefObject<boolean>;
}

const getWallLength = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
};

const getWallAngle = (x1: number, y1: number, x2: number, y2: number) => {
  return (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
};

const getMidPoint = (x1: number, y1: number, x2: number, y2: number) => {
  return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
};

export const WallLayer = memo(
  ({ mousePosRef, redrawRef, doorWindowPriorityRef }: WallLayerProps) => {
    const walls = useEditorStore((s) => s.walls);
    const activeTool = useEditorStore((s) => s.activeTool);
    const selectedElementId = useEditorStore((s) => s.selectedElementId);
    const isDrawing = useEditorStore((s) => s.isDrawing);
    const currentWallStart = useEditorStore((s) => s.currentWallStart);
    const zoom = useEditorStore((s) => s.zoom);
    const updateWall = useEditorStore((s) => s.updateWall);
    const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
    const snapPoint = useEditorStore((s) => s.snapPoint);

    const draggingRef = useRef(false);
    const previewShapeRef = useRef<{ getLayer: () => { batchDraw: () => void } | null } | null>(
      null,
    );
    const [, forceRedraw] = useState(0);

    const triggerRedraw = useCallback(() => {
      forceRedraw((n) => n + 1);
    }, []);

    useEffect(() => {
      redrawRef.current = triggerRedraw;
    }, [redrawRef, triggerRedraw]);

    return (
      <Layer>
        {walls.map((wall) => {
          const isSelected = selectedElementId === wall.id;
          const length = getWallLength(wall.x1, wall.y1, wall.x2, wall.y2);
          const mid = getMidPoint(wall.x1, wall.y1, wall.x2, wall.y2);
          const angle = getWallAngle(wall.x1, wall.y1, wall.x2, wall.y2);
          const normalAngle = angle + 90;
          const labelOffset = wall.thickness / 2 + 14 / zoom;
          const labelX = mid.x + Math.cos((normalAngle * Math.PI) / 180) * labelOffset;
          const labelY = mid.y + Math.sin((normalAngle * Math.PI) / 180) * labelOffset;

          return (
            <Group key={wall.id}>
              <Line
                points={[wall.x1, wall.y1, wall.x2, wall.y2]}
                stroke={isSelected ? "#52525b" : wall.color}
                strokeWidth={wall.thickness}
                lineCap="round"
                lineJoin="round"
                hitStrokeWidth={Math.max(wall.thickness, 20 / zoom)}
                onClick={() => {
                  if (doorWindowPriorityRef.current) {
                    doorWindowPriorityRef.current = false;
                    return;
                  }
                  if (activeTool === "select") {
                    setSelectedElement(wall.id);
                  }
                }}
                onTap={() => {
                  if (doorWindowPriorityRef.current) {
                    doorWindowPriorityRef.current = false;
                    return;
                  }
                  if (activeTool === "select") {
                    setSelectedElement(wall.id);
                  }
                }}
              />
              {isSelected && (
                <>
                  <Circle
                    x={wall.x1}
                    y={wall.y1}
                    radius={14 / zoom}
                    fill="rgba(124, 99, 80, 0.15)"
                    stroke="rgba(124, 99, 80, 0.4)"
                    strokeWidth={1.5 / zoom}
                    listening={false}
                  />
                  <Circle
                    x={wall.x1}
                    y={wall.y1}
                    radius={8 / zoom}
                    fill="#ffffff"
                    stroke="#7c6350"
                    strokeWidth={2.5 / zoom}
                    shadowColor="#7c6350"
                    shadowBlur={8 / zoom}
                    shadowOpacity={0.6}
                    draggable
                    onDragStart={() => {
                      draggingRef.current = true;
                    }}
                    onDragEnd={(e) => {
                      draggingRef.current = false;
                      const pos = snapPoint({ x: e.target.x(), y: e.target.y() });
                      updateWall(wall.id, { x1: pos.x, y1: pos.y });
                      e.target.position({ x: pos.x, y: pos.y });
                    }}
                  />
                  <Circle
                    x={wall.x2}
                    y={wall.y2}
                    radius={14 / zoom}
                    fill="rgba(124, 99, 80, 0.15)"
                    stroke="rgba(124, 99, 80, 0.4)"
                    strokeWidth={1.5 / zoom}
                    listening={false}
                  />
                  <Circle
                    x={wall.x2}
                    y={wall.y2}
                    radius={8 / zoom}
                    fill="#ffffff"
                    stroke="#7c6350"
                    strokeWidth={2.5 / zoom}
                    shadowColor="#7c6350"
                    shadowBlur={8 / zoom}
                    shadowOpacity={0.6}
                    draggable
                    onDragStart={() => {
                      draggingRef.current = true;
                    }}
                    onDragEnd={(e) => {
                      draggingRef.current = false;
                      const pos = snapPoint({ x: e.target.x(), y: e.target.y() });
                      updateWall(wall.id, { x2: pos.x, y2: pos.y });
                      e.target.position({ x: pos.x, y: pos.y });
                    }}
                  />
                  <Text
                    x={labelX - 40}
                    y={labelY - 8}
                    width={80}
                    align="center"
                    text={`${(length / 30).toFixed(1)} ft`}
                    fontSize={12 / zoom}
                    fontFamily="Inter, sans-serif"
                    fill="#8b6f4e"
                    listening={false}
                  />
                </>
              )}
            </Group>
          );
        })}

        {activeTool === "wall" && isDrawing && currentWallStart && (
          <Shape
            ref={previewShapeRef as React.RefObject<never>}
            sceneFunc={(ctx) => {
              const mousePos = mousePosRef.current;
              if (!mousePos) return;
              const snapped = snapPoint(mousePos);
              const sx = currentWallStart.x;
              const sy = currentWallStart.y;
              const ex = snapped.x;
              const ey = snapped.y;
              const length = getWallLength(sx, sy, ex, ey);
              const mid = getMidPoint(sx, sy, ex, ey);

              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(ex, ey);
              ctx.strokeStyle = "rgba(124, 99, 80, 0.6)";
              ctx.lineWidth = 8;
              ctx.lineCap = "round";
              ctx.setLineDash([10, 5]);
              ctx.stroke();
              ctx.setLineDash([]);

              ctx.beginPath();
              ctx.arc(sx, sy, 6 / zoom, 0, Math.PI * 2);
              ctx.fillStyle = "#52525b";
              ctx.fill();

              ctx.beginPath();
              ctx.arc(ex, ey, 6 / zoom, 0, Math.PI * 2);
              ctx.fillStyle = "rgba(124, 99, 80, 0.8)";
              ctx.fill();

              ctx.font = `bold ${13 / zoom}px Inter, sans-serif`;
              ctx.textAlign = "center";
              ctx.fillStyle = "#8b6f4e";
              ctx.fillText(`${(length / 30).toFixed(1)} ft`, mid.x, mid.y - 14 / zoom);
            }}
            listening={false}
          />
        )}
      </Layer>
    );
  },
);
WallLayer.displayName = "WallLayer";
