"use client";

import { memo, useRef, useCallback, useEffect, useState } from "react";
import { Layer, Line, Circle, Text, Group, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatLength } from "@/lib/constants";
import { wallAngle, wallLength, toVec } from "@/lib/canvas";

interface WallLayerProps {
  mousePosRef: React.RefObject<{ x: number; y: number } | null>;
  redrawRef: React.MutableRefObject<(() => void) | null>;
  openingPriorityRef: React.RefObject<boolean>;
}

const DEFAULT_WALL_COLOR = "#3a3a4a";

export const WallLayer = memo(({ mousePosRef, redrawRef, openingPriorityRef }: WallLayerProps) => {
  const walls = useEditorStore((s) => s.walls);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const isDrawing = useEditorStore((s) => s.isDrawing);
  const currentWallStart = useEditorStore((s) => s.currentWallStart);
  const zoom = useEditorStore((s) => s.zoom);
  const canEdit = useEditorStore((s) => s.canEdit);
  const updateWall = useEditorStore((s) => s.updateWall);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const snapPoint = useEditorStore((s) => s.snapPoint);

  // Millimetres per screen pixel, so handles and text stay the same size on screen.
  const px = 1 / (zoom * PX_PER_MM);

  const [, forceRedraw] = useState(0);
  const triggerRedraw = useCallback(() => forceRedraw((n) => n + 1), []);
  useEffect(() => {
    redrawRef.current = triggerRedraw;
  }, [redrawRef, triggerRedraw]);

  const previewShapeRef = useRef(null);

  const select = (id: string) => {
    if (openingPriorityRef.current) {
      (openingPriorityRef as React.MutableRefObject<boolean>).current = false;
      return;
    }
    if (activeTool === "select") setSelectedElement(id);
  };

  return (
    <Layer>
      {walls.map((wall) => {
        const isSelected = selectedElementId === wall.id;
        const length = wallLength(wall);
        const mid = [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2];
        const normal = wallAngle(wall) + Math.PI / 2;
        const labelOffset = wall.thickness / 2 + 14 * px;
        const labelX = mid[0] + Math.cos(normal) * labelOffset;
        const labelY = mid[1] + Math.sin(normal) * labelOffset;

        const handle = (end: "from" | "to") => (
          <>
            <Circle
              x={wall[end][0]}
              y={wall[end][1]}
              radius={14 * px}
              fill="rgba(124, 99, 80, 0.15)"
              stroke="rgba(124, 99, 80, 0.4)"
              strokeWidth={1.5 * px}
              listening={false}
            />
            <Circle
              x={wall[end][0]}
              y={wall[end][1]}
              radius={8 * px}
              fill="#ffffff"
              stroke="#7c6350"
              strokeWidth={2.5 * px}
              shadowColor="#7c6350"
              shadowBlur={8 * px}
              shadowOpacity={0.6}
              draggable={canEdit}
              onDragEnd={(e) => {
                const pos = snapPoint({ x: e.target.x(), y: e.target.y() });
                updateWall(wall.id, { [end]: toVec(pos) });
                e.target.position(pos);
              }}
            />
          </>
        );

        return (
          <Group key={wall.id}>
            <Line
              points={[...wall.from, ...wall.to]}
              stroke={isSelected ? "#52525b" : (wall.color ?? DEFAULT_WALL_COLOR)}
              strokeWidth={wall.thickness}
              lineCap="round"
              lineJoin="round"
              hitStrokeWidth={Math.max(wall.thickness, 20 * px)}
              onClick={() => select(wall.id)}
              onTap={() => select(wall.id)}
            />
            {isSelected && (
              <>
                {handle("from")}
                {handle("to")}
                <Text
                  x={labelX - 400}
                  y={labelY - 8 * px}
                  width={800}
                  align="center"
                  text={formatLength(length)}
                  fontSize={12 * px}
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
          ref={previewShapeRef}
          sceneFunc={(ctx) => {
            const mousePos = mousePosRef.current;
            if (!mousePos) return;
            const snapped = snapPoint(mousePos);
            const sx = currentWallStart.x;
            const sy = currentWallStart.y;
            const ex = snapped.x;
            const ey = snapped.y;
            const length = Math.hypot(ex - sx, ey - sy);

            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = "rgba(124, 99, 80, 0.6)";
            ctx.lineWidth = 80;
            ctx.lineCap = "round";
            ctx.setLineDash([100, 50]);
            ctx.stroke();
            ctx.setLineDash([]);

            for (const [x, y, fill] of [
              [sx, sy, "#52525b"],
              [ex, ey, "rgba(124, 99, 80, 0.8)"],
            ] as const) {
              ctx.beginPath();
              ctx.arc(x, y, 6 * px, 0, Math.PI * 2);
              ctx.fillStyle = fill;
              ctx.fill();
            }

            ctx.font = `bold ${13 * px}px Inter, sans-serif`;
            ctx.textAlign = "center";
            ctx.fillStyle = "#8b6f4e";
            ctx.fillText(formatLength(length), (sx + ex) / 2, (sy + ey) / 2 - 14 * px);
          }}
          listening={false}
        />
      )}
    </Layer>
  );
});
WallLayer.displayName = "WallLayer";
