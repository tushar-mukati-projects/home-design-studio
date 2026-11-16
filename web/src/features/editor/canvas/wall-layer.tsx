"use client";

import { memo, useMemo, type RefObject } from "react";
import { Circle, Group, Line, Rect } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM, formatLength } from "@/lib/constants";
import { labelNormal, toDegrees, toVec, wallAngle, wallJunctions } from "@/lib/canvas";
import { wallLength, type Vec2, type Wall } from "@/shared/canvas";
import { CHIP_OFFSET_PX, Chip } from "./chip";
import { useHover } from "./hover";
import { FLAT } from "./konva";
import { HANDLE_FILL, HANDLE_HALO, SELECTION, WALL_FILL, WALL_HOVER } from "./palette";
import type Konva from "konva";

const HANDLE_RADIUS_PX = 7;
const HANDLE_HALO_RADIUS_PX = 13;
const HANDLE_STROKE_PX = 2;
const WALL_HIT_MIN_PX = 24;

type WallEnd = "from" | "to";

type HandleProps = {
  wall: Wall;
  end: WallEnd;
  px: number;
};

type WallItemProps = {
  wall: Wall;
  isSelected: boolean;
  canEdit: boolean;
  px: number;
  openingPriorityRef: RefObject<boolean>;
};

type WallShapesProps = {
  openingPriorityRef: RefObject<boolean>;
};

const WallLayer = ({ openingPriorityRef }: WallShapesProps) => {
  const walls = useEditorStore((s) => s.walls);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const canEdit = useEditorStore((s) => s.canEdit);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);
  const junctions = useMemo(() => wallJunctions(walls), [walls]);

  return (
    <>
      {junctions.map(({ at, thickness }) => {
        const wall = walls.find((w) => sameVec(w.from, at) || sameVec(w.to, at));
        if (!wall) return null;
        return (
          <Rect
            key={`${at[0]},${at[1]}`}
            x={at[0]}
            y={at[1]}
            width={thickness}
            height={thickness}
            offsetX={thickness / 2}
            offsetY={thickness / 2}
            rotation={toDegrees(wallAngle(wall))}
            fill={wall.color ?? WALL_FILL}
            listening={false}
            {...FLAT}
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
};

const sameVec = (a: Vec2, b: Vec2) => a[0] === b[0] && a[1] === b[1];

const setCursor = (node: Konva.Node, cursor: string) =>
  node.getStage()?.container().style.setProperty("cursor", cursor);

const WallPiece = ({ wall, isSelected, canEdit, px, openingPriorityRef }: WallItemProps) => {
  const { hovered, ...hover } = useHover();

  const select = () => {
    if (openingPriorityRef.current) {
      openingPriorityRef.current = false;
      return;
    }
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(wall.id);
  };

  const normal = labelNormal(wallAngle(wall));
  const labelOffset = wall.thickness / 2 + CHIP_OFFSET_PX * px;
  const color = isSelected ? SELECTION : hovered ? WALL_HOVER : (wall.color ?? WALL_FILL);

  return (
    <Group>
      <Line
        points={[...wall.from, ...wall.to]}
        stroke={color}
        strokeWidth={wall.thickness}
        lineCap="butt"
        hitStrokeWidth={Math.max(wall.thickness, WALL_HIT_MIN_PX * px)}
        onClick={select}
        onTap={select}
        {...hover}
        {...FLAT}
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
          text={formatLength(wallLength(wall))}
        />
      )}
    </Group>
  );
};

const Handle = ({ wall, end, px }: HandleProps) => {
  const move = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;
    const abs = e.target.getAbsolutePosition();
    const k = stage.scaleX();
    const s = useEditorStore.getState();
    const { point } = s.snapWallPoint(
      { x: (abs.x - stage.x()) / k, y: (abs.y - stage.y()) / k },
      { ignoreWallId: wall.id },
    );
    s.updateWall(wall.id, { [end]: toVec(point) }, `wall-end:${wall.id}:${end}`);
    e.target.position({ x: 0, y: 0 });
  };

  return (
    <Group
      x={wall[end][0]}
      y={wall[end][1]}
      scaleX={px}
      scaleY={px}
      name={EXPORT_HIDDEN_LAYER_NAME}
    >
      <Circle radius={HANDLE_HALO_RADIUS_PX} fill={HANDLE_HALO} listening={false} {...FLAT} />
      <Circle
        radius={HANDLE_RADIUS_PX}
        fill={HANDLE_FILL}
        stroke={SELECTION}
        strokeWidth={HANDLE_STROKE_PX}
        draggable
        onDragMove={move}
        onDragEnd={move}
        onMouseEnter={(e) => setCursor(e.target, "move")}
        onMouseLeave={(e) => setCursor(e.target, "default")}
        {...FLAT}
      />
    </Group>
  );
};

const WallItem = memo(WallPiece);

export const WallShapes = memo(WallLayer);
