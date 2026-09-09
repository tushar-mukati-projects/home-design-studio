"use client";

import { memo, useMemo } from "react";
import { Line, Rect, Circle, Text, Group, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatLength } from "@/lib/constants";
import { DEFAULTS, toVec, wallAngle, wallJunctions, wallLength } from "@/lib/canvas";
import { useHover } from "./hover";
import type { Vec2, Wall } from "@/types";
import type Konva from "konva";

export const WALL_COLOR = "#2f3038";
export const ACCENT = "#7c6350";
const HOVER = "#4b4c58";
export const LABEL_FONT = "Inter, system-ui, sans-serif";
const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

export interface PointerState {
  x: number;
  y: number;
  shift: boolean;
}

const sameVec = (a: Vec2, b: Vec2) => a[0] === b[0] && a[1] === b[1];

const setCursor = (node: Konva.Node, cursor: string) =>
  node.getStage()?.container().style.setProperty("cursor", cursor);

const Handle = ({ wall, end, px }: { wall: Wall; end: "from" | "to"; px: number }) => {
  const move = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const abs = e.target.getAbsolutePosition();
    const k = stage.scaleX();
    const { point } = useEditorStore
      .getState()
      .snapWallPoint(
        { x: (abs.x - stage.x()) / k, y: (abs.y - stage.y()) / k },
        { ignoreWallId: wall.id },
      );
    useEditorStore
      .getState()
      .updateWall(wall.id, { [end]: toVec(point) }, `wall-end:${wall.id}:${end}`);
    e.target.position({ x: 0, y: 0 });
  };

  return (
    <Group x={wall[end][0]} y={wall[end][1]} scaleX={px} scaleY={px}>
      <Circle radius={13} fill="rgba(124, 99, 80, 0.14)" listening={false} {...flat} />
      <Circle
        radius={7}
        fill="#ffffff"
        stroke={ACCENT}
        strokeWidth={2}
        draggable
        onDragMove={move}
        onDragEnd={move}
        onMouseEnter={(e) => setCursor(e.target, "move")}
        onMouseLeave={(e) => setCursor(e.target, "default")}
        {...flat}
      />
    </Group>
  );
};

export const Chip = ({
  x,
  y,
  px,
  text,
  strong = false,
}: {
  x: number;
  y: number;
  px: number;
  text: string;
  strong?: boolean;
}) => {
  const w = text.length * 6.6 + 16;
  return (
    <Group x={x} y={y} scaleX={px} scaleY={px} listening={false}>
      <Rect
        x={-w / 2}
        y={-11}
        width={w}
        height={22}
        fill="rgba(255, 255, 255, 0.92)"
        stroke="rgba(0, 0, 0, 0.08)"
        strokeWidth={1}
        cornerRadius={5}
        {...flat}
      />
      <Text
        x={-w / 2}
        y={-11}
        width={w}
        height={22}
        align="center"
        verticalAlign="middle"
        text={text}
        fontSize={11}
        fontStyle={strong ? "600" : "normal"}
        fontFamily={LABEL_FONT}
        fill="#2a2a34"
      />
    </Group>
  );
};

interface WallItemProps {
  wall: Wall;
  isSelected: boolean;
  canEdit: boolean;
  px: number;
  openingPriorityRef: React.RefObject<boolean>;
}

const WallItem = memo(function WallItem({
  wall,
  isSelected,
  canEdit,
  px,
  openingPriorityRef,
}: WallItemProps) {
  const { hovered, ...hover } = useHover();

  const select = () => {
    if (openingPriorityRef.current) {
      (openingPriorityRef as React.MutableRefObject<boolean>).current = false;
      return;
    }
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(wall.id);
  };

  const length = wallLength(wall);
  const angle = wallAngle(wall);
  const labelOffset = wall.thickness / 2 + 16 * px;
  const normal =
    Math.sin(angle) >= 0 && Math.cos(angle) > 0 ? angle - Math.PI / 2 : angle + Math.PI / 2;
  const color = isSelected ? ACCENT : hovered ? HOVER : (wall.color ?? WALL_COLOR);

  return (
    <Group>
      <Line
        points={[...wall.from, ...wall.to]}
        stroke={color}
        strokeWidth={wall.thickness}
        lineCap="butt"
        hitStrokeWidth={Math.max(wall.thickness, 24 * px)}
        onClick={select}
        onTap={select}
        {...hover}
        {...flat}
      />
      {isSelected && canEdit && (
        <>
          <Handle wall={wall} end="from" px={px} />
          <Handle wall={wall} end="to" px={px} />
        </>
      )}
      {isSelected && (
        <Chip
          x={(wall.from[0] + wall.to[0]) / 2 + Math.cos(normal) * labelOffset}
          y={(wall.from[1] + wall.to[1]) / 2 + Math.sin(normal) * labelOffset}
          px={px}
          text={formatLength(length)}
          strong
        />
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
  const junctions = useMemo(() => wallJunctions(walls), [walls]);

  return (
    <>
      {junctions.map(({ at, thickness }) => {
        const wall = walls.find((w) => sameVec(w.from, at) || sameVec(w.to, at))!;
        return (
          <Rect
            key={`${at[0]},${at[1]}`}
            x={at[0]}
            y={at[1]}
            width={thickness}
            height={thickness}
            offsetX={thickness / 2}
            offsetY={thickness / 2}
            rotation={(wallAngle(wall) * 180) / Math.PI}
            fill={wall.color ?? WALL_COLOR}
            listening={false}
            {...flat}
          />
        );
      })}
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

export const WallPreview = ({
  pointerRef,
}: {
  pointerRef: React.RefObject<PointerState | null>;
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
        const pointer = pointerRef.current;
        const start = s.currentWallStart;
        if (!pointer || !start) return;
        const px = 1 / (s.zoom * PX_PER_MM);
        const { point: end, joined } = s.snapWallPoint(pointer, { shift: pointer.shift });
        const length = Math.hypot(end.x - start.x, end.y - start.y);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.lineCap = "butt";
        ctx.lineWidth = DEFAULTS.wallThickness;
        ctx.strokeStyle = "rgba(47, 48, 56, 0.28)";
        ctx.stroke();
        ctx.lineWidth = 1.2 * px;
        ctx.strokeStyle = ACCENT;
        ctx.setLineDash([6 * px, 4 * px]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(start.x, start.y, 4 * px, 0, Math.PI * 2);
        ctx.fillStyle = ACCENT;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(end.x, end.y, joined ? 8 * px : 4 * px, 0, Math.PI * 2);
        if (joined) {
          ctx.lineWidth = 2 * px;
          ctx.strokeStyle = ACCENT;
          ctx.stroke();
        } else {
          ctx.fill();
        }

        if (length < 1) return;
        const degrees = Math.round(((((-angle * 180) / Math.PI) % 360) + 360) % 360);
        const text = pointer.shift ? `${formatLength(length)}  ${degrees}°` : formatLength(length);
        const normal =
          Math.sin(angle) >= 0 && Math.cos(angle) > 0 ? angle - Math.PI / 2 : angle + Math.PI / 2;
        const offset = DEFAULTS.wallThickness / 2 + 16 * px;
        const cx = (start.x + end.x) / 2 + Math.cos(normal) * offset;
        const cy = (start.y + end.y) / 2 + Math.sin(normal) * offset;
        ctx.font = `600 ${11 * px}px ${LABEL_FONT}`;
        const w = ctx.measureText(text).width + 16 * px;
        ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
        ctx.fillRect(cx - w / 2, cy - 11 * px, w, 22 * px);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#2a2a34";
        ctx.fillText(text, cx, cy);
      }}
    />
  );
};
