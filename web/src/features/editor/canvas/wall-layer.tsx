"use client";

import { memo } from "react";
import { Line, Circle, Text, Group, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatLength } from "@/lib/constants";
import { wallAngle, wallLength, toVec } from "@/lib/canvas";
import type { Wall } from "@/types";

const DEFAULT_WALL_COLOR = "#3a3a4a";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

interface WallItemProps {
  wall: Wall;
  isSelected: boolean;
  canEdit: boolean;
  px: number;
  openingPriorityRef: React.RefObject<boolean>;
}

const Handle = ({ wall, end, px }: { wall: Wall; end: "from" | "to"; px: number }) => (
  <Group x={wall[end][0]} y={wall[end][1]} scaleX={px} scaleY={px}>
    <Circle
      radius={14}
      fill="rgba(124, 99, 80, 0.15)"
      stroke="rgba(124, 99, 80, 0.4)"
      strokeWidth={1.5}
      listening={false}
      {...flat}
    />
    <Circle
      radius={8}
      fill="#ffffff"
      stroke="#7c6350"
      strokeWidth={2.5}
      draggable
      {...flat}
      onDragEnd={(e) => {
        const group = e.target.getParent();
        const abs = e.target.getAbsolutePosition();
        const stage = e.target.getStage();
        if (!group || !stage) return;
        const k = stage.scaleX();
        const pos = useEditorStore.getState().snapPoint({
          x: (abs.x - stage.x()) / k,
          y: (abs.y - stage.y()) / k,
        });
        useEditorStore.getState().updateWall(wall.id, { [end]: toVec(pos) });
        e.target.position({ x: 0, y: 0 });
      }}
    />
  </Group>
);

const WallItem = memo(function WallItem({
  wall,
  isSelected,
  canEdit,
  px,
  openingPriorityRef,
}: WallItemProps) {
  const select = () => {
    if (openingPriorityRef.current) {
      (openingPriorityRef as React.MutableRefObject<boolean>).current = false;
      return;
    }
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(wall.id);
  };

  const length = wallLength(wall);
  const mid = [(wall.from[0] + wall.to[0]) / 2, (wall.from[1] + wall.to[1]) / 2];
  const normal = wallAngle(wall) + Math.PI / 2;
  const labelOffset = wall.thickness / 2 + 14 * px;

  return (
    <Group>
      <Line
        points={[...wall.from, ...wall.to]}
        stroke={isSelected ? "#52525b" : (wall.color ?? DEFAULT_WALL_COLOR)}
        strokeWidth={wall.thickness}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={Math.max(wall.thickness, 20 * px)}
        onClick={select}
        onTap={select}
        {...flat}
      />
      {isSelected && canEdit && (
        <>
          <Handle wall={wall} end="from" px={px} />
          <Handle wall={wall} end="to" px={px} />
        </>
      )}
      {isSelected && (
        <Group
          x={mid[0] + Math.cos(normal) * labelOffset}
          y={mid[1] + Math.sin(normal) * labelOffset}
          scaleX={px}
          scaleY={px}
          listening={false}
        >
          <Text
            x={-40}
            y={-8}
            width={80}
            align="center"
            text={formatLength(length)}
            fontSize={12}
            fontFamily="Inter, sans-serif"
            fill="#8b6f4e"
          />
        </Group>
      )}
    </Group>
  );
});

interface WallShapesProps {
  openingPriorityRef: React.RefObject<boolean>;
}

export const WallShapes = memo(function WallShapes({ openingPriorityRef }: WallShapesProps) {
  const walls = useEditorStore((s) => s.walls);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const canEdit = useEditorStore((s) => s.canEdit);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);

  return (
    <>
      {walls.map((wall) => (
        <WallItem
          key={wall.id}
          wall={wall}
          isSelected={selectedElementId === wall.id}
          canEdit={canEdit}
          px={px}
          openingPriorityRef={openingPriorityRef}
        />
      ))}
    </>
  );
});

// Drawn straight from refs on each animation frame; React is not involved per mouse move.
export const WallPreview = ({
  mousePosRef,
}: {
  mousePosRef: React.RefObject<{ x: number; y: number } | null>;
}) => {
  const active = useEditorStore(
    (s) => s.activeTool === "wall" && s.isDrawing && !!s.currentWallStart,
  );
  if (!active) return null;

  return (
    <Shape
      listening={false}
      sceneFunc={(ctx) => {
        const s = useEditorStore.getState();
        const mouse = mousePosRef.current;
        const start = s.currentWallStart;
        if (!mouse || !start) return;
        const px = 1 / (s.zoom * PX_PER_MM);
        const end = s.snapPoint(mouse);
        const length = Math.hypot(end.x - start.x, end.y - start.y);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = "rgba(124, 99, 80, 0.6)";
        ctx.lineWidth = 80;
        ctx.lineCap = "round";
        ctx.setLineDash([100, 50]);
        ctx.stroke();
        ctx.setLineDash([]);

        for (const [x, y, fill] of [
          [start.x, start.y, "#52525b"],
          [end.x, end.y, "rgba(124, 99, 80, 0.8)"],
        ] as const) {
          ctx.beginPath();
          ctx.arc(x, y, 6 * px, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
        }

        ctx.font = `bold ${13 * px}px Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillStyle = "#8b6f4e";
        ctx.fillText(formatLength(length), (start.x + end.x) / 2, (start.y + end.y) / 2 - 14 * px);
      }}
    />
  );
};
