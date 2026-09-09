"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { Shape, Line, Rect, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { wallAngle, pointOnWall, offsetAlongWall, clampOpeningOffset } from "@/lib/canvas";
import { ACCENT } from "./wall-layer";
import { useHover } from "./hover";
import type { Opening, Wall } from "@/types";
import type Konva from "konva";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;
const hairline = { strokeScaleEnabled: false, listening: false, ...flat } as const;
const JAMB = "#6b6b78";
const LEAF = "#b89a78";
const LEAF_EDGE = "#8a6f52";
const SWING = "#a3a3ad";
const GLASS = "#cfe4f5";
const FRAME = "#5b9bd5";

const canvasBackground = () =>
  typeof window === "undefined"
    ? "#f8f9fb"
    : getComputedStyle(document.documentElement).getPropertyValue("--canvas-bg").trim() ||
      "#f8f9fb";

const Door = ({ opening, wall, bg }: { opening: Opening; wall: Wall; bg: string }) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  const side = opening.swing === "out" ? -1 : 1;
  const double = opening.variant === "double";
  const leafLength = double ? half : opening.width;
  const leaves: [number, 1 | -1][] = double
    ? [
        [-half, 1],
        [half, -1],
      ]
    : opening.hinge === "right"
      ? [[half, -1]]
      : [[-half, 1]];

  return (
    <>
      <Rect
        x={-half}
        y={-t - 2}
        width={opening.width}
        height={wall.thickness + 4}
        fill={bg}
        {...flat}
      />
      <Rect
        x={-half}
        y={side > 0 ? 0 : -opening.width}
        width={opening.width}
        height={opening.width}
        fill="rgba(0, 0, 0, 0)"
        {...flat}
      />
      {[-half, half].map((x) => (
        <Line key={x} points={[x, -t, x, t]} stroke={JAMB} strokeWidth={2} {...hairline} />
      ))}
      {leaves.map(([hx, dir]) => {
        const tip = side * leafLength;
        return (
          <Group key={hx} x={hx} y={side * t} listening={false}>
            <Shape
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                ctx.arc(
                  0,
                  0,
                  leafLength,
                  (side * Math.PI) / 2,
                  dir === 1 ? 0 : Math.PI,
                  side * dir === 1,
                );
                ctx.strokeShape(shape);
              }}
              stroke={SWING}
              strokeWidth={1}
              {...hairline}
            />
            <Rect
              x={-20}
              y={Math.min(0, tip)}
              width={40}
              height={Math.abs(tip)}
              fill={LEAF}
              stroke={LEAF_EDGE}
              strokeWidth={1}
              {...hairline}
            />
          </Group>
        );
      })}
    </>
  );
};

const SlidingDoor = ({ opening, wall, bg }: { opening: Opening; wall: Wall; bg: string }) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  const side = opening.swing === "out" ? -1 : 1;
  const dir = opening.hinge === "right" ? -1 : 1;
  const leaf = { fill: LEAF, stroke: LEAF_EDGE, strokeWidth: 1, ...hairline };
  const arrowY = side * (t + 70);
  return (
    <>
      <Rect
        x={-half}
        y={-t - 2}
        width={opening.width}
        height={wall.thickness + 4}
        fill={bg}
        {...flat}
      />
      {[-half, half].map((x) => (
        <Line key={x} points={[x, -t, x, t]} stroke={JAMB} strokeWidth={2} {...hairline} />
      ))}
      <Rect x={dir > 0 ? -half : 0} y={-20} width={half} height={40} {...leaf} />
      <Rect
        x={dir > 0 ? -60 : -half + 60}
        y={side > 0 ? 25 : -65}
        width={half}
        height={40}
        {...leaf}
      />
      <Line
        points={[dir * -half * 0.1, arrowY, dir * half * 0.7, arrowY]}
        stroke={SWING}
        strokeWidth={1}
        {...hairline}
      />
      <Line
        points={[
          dir * half * 0.5,
          arrowY - 40,
          dir * half * 0.7,
          arrowY,
          dir * half * 0.5,
          arrowY + 40,
        ]}
        stroke={SWING}
        strokeWidth={1}
        {...hairline}
      />
    </>
  );
};

const Window = ({ opening, wall, bg }: { opening: Opening; wall: Wall; bg: string }) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  const g = Math.max(30, wall.thickness * 0.3);
  const frame = { stroke: FRAME, strokeWidth: 1.5, ...hairline };

  return (
    <>
      <Rect
        x={-half}
        y={-t - 2}
        width={opening.width}
        height={wall.thickness + 4}
        fill={bg}
        {...flat}
      />
      <Rect x={-half} y={-g / 2} width={opening.width} height={g} fill={GLASS} {...hairline} />
      <Line points={[-half, -g / 2, half, -g / 2]} {...frame} />
      <Line points={[-half, g / 2, half, g / 2]} {...frame} />
      <Line points={[0, -g / 2, 0, g / 2]} {...frame} />
      {[-half, half].map((x) => (
        <Line key={x} points={[x, -t, x, t]} stroke={JAMB} strokeWidth={2} {...hairline} />
      ))}
    </>
  );
};

interface OpeningItemProps {
  opening: Opening;
  wall: Wall;
  isSelected: boolean;
  draggable: boolean;
  bg: string;
  register: (id: string, node: Konva.Group | null) => void;
}

const OpeningItem = memo(function OpeningItem({
  opening,
  wall,
  isSelected,
  draggable,
  bg,
  register,
}: OpeningItemProps) {
  const { hovered, ...hover } = useHover();
  const groupRef = useRef<Konva.Group | null>(null);
  const [x, y] = pointOnWall(wall, opening.offset);
  const angleDeg = (wallAngle(wall) * 180) / Math.PI;

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
      onTransformEnd={(e) => {
        const width = Math.round(
          Math.max(300, Math.min(3000, opening.width * Math.abs(e.target.scaleX()))),
        );
        settle(e.target, { width });
      }}
      {...hover}
    >
      {opening.kind === "door" ? (
        opening.variant === "sliding" ? (
          <SlidingDoor opening={opening} wall={wall} bg={bg} />
        ) : (
          <Door opening={opening} wall={wall} bg={bg} />
        )
      ) : (
        <Window opening={opening} wall={wall} bg={bg} />
      )}
      {(isSelected || hovered) && (
        <Rect
          x={-opening.width / 2}
          y={-wall.thickness / 2}
          width={opening.width}
          height={wall.thickness}
          stroke={ACCENT}
          strokeWidth={isSelected ? 2 : 1.5}
          opacity={isSelected ? 1 : 0.6}
          {...hairline}
        />
      )}
    </Group>
  );
});

export const OpeningShapes = memo(function OpeningShapes() {
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const zoom = useEditorStore((s) => s.zoom);
  const anchorSize = Math.max(8, Math.min(12, 10 * Math.sqrt(zoom)));

  const bg = canvasBackground();
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodes = useRef<Map<string, Konva.Group>>(new Map());
  const wallMap = new Map(walls.map((w) => [w.id, w]));

  const register = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const selectedIsOpening = !!selectedElementId && openings.some((o) => o.id === selectedElementId);
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node =
      selectedIsOpening && selectedElementId ? nodes.current.get(selectedElementId) : undefined;
    transformer.nodes(node ? [node] : []);
  }, [selectedElementId, selectedIsOpening]);

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
            bg={bg}
            register={register}
          />
        );
      })}
      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        enabledAnchors={["middle-left", "middle-right"]}
        borderEnabled={false}
        anchorFill="#ffffff"
        anchorStroke={ACCENT}
        anchorStrokeWidth={2}
        anchorSize={anchorSize}
        anchorCornerRadius={anchorSize / 2}
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 ? oldBox : newBox)}
      />
    </>
  );
});
