"use client";

import { memo, useRef } from "react";
import { Group, Rect, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import {
  EXPORT_HIDDEN_LAYER_NAME,
  OPENING_WIDTH_MAX_MM,
  OPENING_WIDTH_MIN_MM,
} from "@/lib/constants";
import {
  clampOpeningOffset,
  offsetAlongWall,
  pointOnWall,
  toDegrees,
  wallAngle,
} from "@/lib/canvas";
import { useHover } from "./hover";
import { HAIRLINE } from "./konva";
import { DoorShape, SlidingDoorShape, WindowShape } from "./opening-shapes";
import { HANDLE_FILL, SELECTION } from "./palette";
import { anchorSizeFor, useTransformerSelection } from "./use-transformer-selection";
import type { Opening, Wall } from "@/shared/canvas";
import type Konva from "konva";

const MIN_TRANSFORM_PX = 20;
const ANCHOR_STROKE_PX = 2;
const OUTLINE_SELECTED_PX = 2;
const OUTLINE_HOVER_PX = 1.5;
const OUTLINE_HOVER_OPACITY = 0.6;
const WIDTH_ANCHORS = ["middle-left", "middle-right"];

type OpeningItemProps = {
  opening: Opening;
  wall: Wall;
  isSelected: boolean;
  draggable: boolean;
  register: (id: string, node: Konva.Group | null) => void;
};

const OpeningLayer = () => {
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const zoom = useEditorStore((s) => s.zoom);
  const anchorSize = anchorSizeFor(zoom);
  const wallMap = new Map(walls.map((w) => [w.id, w]));
  const { transformerRef, register } = useTransformerSelection(
    selectedElementId,
    (id) => openings.some((o) => o.id === id),
    canEdit,
  );

  return (
    <>
      {openings.map((opening) => {
        const wall = wallMap.get(opening.wall);
        if (!wall) return null;
        return (
          <OpeningItem
            key={opening.id}
            opening={opening}
            wall={wall}
            isSelected={selectedElementId === opening.id}
            draggable={canEdit && activeTool === "select"}
            register={register}
          />
        );
      })}
      <Transformer
        ref={transformerRef}
        name={EXPORT_HIDDEN_LAYER_NAME}
        rotateEnabled={false}
        enabledAnchors={WIDTH_ANCHORS}
        borderEnabled={false}
        anchorFill={HANDLE_FILL}
        anchorStroke={SELECTION}
        anchorStrokeWidth={ANCHOR_STROKE_PX}
        anchorSize={anchorSize}
        anchorCornerRadius={anchorSize / 2}
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) => (newBox.width < MIN_TRANSFORM_PX ? oldBox : newBox)}
      />
    </>
  );
};

const OpeningPiece = ({ opening, wall, isSelected, draggable, register }: OpeningItemProps) => {
  const { hovered, ...hover } = useHover();
  const groupRef = useRef<Konva.Group | null>(null);
  const [x, y] = pointOnWall(wall, opening.offset);
  const angleDeg = toDegrees(wallAngle(wall));

  const settle = (node: Konva.Node, patch: Partial<Opening>) => {
    const offset = clampOpeningOffset(
      { width: patch.width ?? opening.width },
      wall,
      offsetAlongWall(wall, node.x(), node.y()),
    );
    useEditorStore.getState().updateOpening(opening.id, { ...patch, offset });
    const [sx, sy] = pointOnWall(wall, offset);
    node.position({ x: sx, y: sy });
    node.rotation(angleDeg);
    node.scaleX(1);
    node.scaleY(1);
  };

  const select = () => {
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(opening.id);
  };

  const slideAlongWall = (pos: Konva.Vector2d) => {
    const stage = groupRef.current?.getStage();
    if (!stage) return pos;
    const k = stage.scaleX();
    const mm = { x: (pos.x - stage.x()) / k, y: (pos.y - stage.y()) / k };
    const offset = clampOpeningOffset(opening, wall, offsetAlongWall(wall, mm.x, mm.y));
    const [wx, wy] = pointOnWall(wall, offset);
    return { x: wx * k + stage.x(), y: wy * k + stage.y() };
  };

  const resize = (node: Konva.Node) => {
    const scaled = opening.width * Math.abs(node.scaleX());
    const width = Math.round(
      Math.max(OPENING_WIDTH_MIN_MM, Math.min(OPENING_WIDTH_MAX_MM, scaled)),
    );
    settle(node, { width });
  };

  return (
    <Group
      ref={(node) => {
        groupRef.current = node;
        register(opening.id, node);
      }}
      x={x}
      y={y}
      rotation={angleDeg}
      draggable={draggable}
      dragBoundFunc={slideAlongWall}
      onClick={select}
      onTap={select}
      onDragEnd={(e) => settle(e.target, {})}
      onTransformEnd={(e) => resize(e.target)}
      {...hover}
    >
      <OpeningShape opening={opening} wall={wall} />
      {(isSelected || hovered) && (
        <Rect
          name={EXPORT_HIDDEN_LAYER_NAME}
          x={-opening.width / 2}
          y={-wall.thickness / 2}
          width={opening.width}
          height={wall.thickness}
          stroke={SELECTION}
          strokeWidth={isSelected ? OUTLINE_SELECTED_PX : OUTLINE_HOVER_PX}
          opacity={isSelected ? 1 : OUTLINE_HOVER_OPACITY}
          {...HAIRLINE}
        />
      )}
    </Group>
  );
};

const OpeningShape = ({ opening, wall }: Pick<OpeningItemProps, "opening" | "wall">) => {
  if (opening.kind === "window") return <WindowShape opening={opening} wall={wall} />;
  if (opening.variant === "sliding") return <SlidingDoorShape opening={opening} wall={wall} />;
  return <DoorShape opening={opening} wall={wall} />;
};

const OpeningItem = memo(OpeningPiece);

export const OpeningShapes = memo(OpeningLayer);
