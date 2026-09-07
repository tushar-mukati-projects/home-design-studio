"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { Shape, Line, Rect, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM } from "@/lib/constants";
import { wallAngle, pointOnWall, offsetAlongWall, clampOpeningOffset } from "@/lib/canvas";
import type { Opening, Wall } from "@/types";
import type Konva from "konva";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

const arc = (hingeX: number, radius: number, startDeg: number, px: number) => (
  <Shape
    sceneFunc={(ctx, shape) => {
      const start = (startDeg * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(hingeX, 0);
      ctx.arc(hingeX, 0, radius, start, start + Math.PI / 2, false);
      ctx.closePath();
      ctx.fillStrokeShape(shape);
    }}
    stroke="#9c9ca6"
    strokeWidth={1.5}
    strokeScaleEnabled={false}
    dash={[px * 4, px * 3]}
    listening={false}
    {...flat}
  />
);

const Door = ({ opening, wall, px }: { opening: Opening; wall: Wall; px: number }) => {
  const half = opening.width / 2;
  const t = wall.thickness * 0.3;
  const hingeRight = opening.hinge === "right";
  const swingOut = opening.swing === "out";
  const hingeX = hingeRight ? half : -half;
  const singleStart = hingeRight ? (swingOut ? 90 : 180) : swingOut ? 0 : -90;

  return (
    <>
      <Line
        points={[-half, 0, half, 0]}
        stroke="#f4f5f7"
        strokeWidth={wall.thickness + 40}
        listening={false}
        {...flat}
      />
      <Rect x={-half} y={-t} width={opening.width} height={t * 2} fill="#a08870" {...flat} />
      <Line
        points={[-half, -t, -half, t]}
        stroke="#8a7560"
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={false}
        {...flat}
      />
      <Line
        points={[half, -t, half, t]}
        stroke="#8a7560"
        strokeWidth={2}
        strokeScaleEnabled={false}
        listening={false}
        {...flat}
      />
      {(opening.variant ?? "single") === "single" && arc(hingeX, opening.width, singleStart, px)}
      {opening.variant === "double" && (
        <>
          {arc(-half, half, swingOut ? 0 : -90, px)}
          {arc(half, half, swingOut ? 90 : 180, px)}
        </>
      )}
    </>
  );
};

const Window = ({ opening, wall }: { opening: Opening; wall: Wall }) => {
  const half = opening.width / 2;
  const t = wall.thickness * 0.4;
  const frame = {
    stroke: "#87CEEB",
    strokeWidth: 1.5,
    strokeScaleEnabled: false,
    listening: false,
    ...flat,
  };
  return (
    <>
      <Line
        points={[-half, 0, half, 0]}
        stroke="#f4f5f7"
        strokeWidth={wall.thickness + 20}
        listening={false}
        {...flat}
      />
      <Rect
        x={-half}
        y={-t}
        width={opening.width}
        height={t * 2}
        fill="#87CEEB"
        opacity={0.4}
        {...flat}
      />
      <Line points={[-half, -t, half, -t]} {...frame} />
      <Line points={[-half, t, half, t]} {...frame} />
      <Line points={[-half, -t, -half, t]} {...frame} />
      <Line points={[half, -t, half, t]} {...frame} />
      <Line points={[0, -t, 0, t]} {...frame} strokeWidth={1} />
    </>
  );
};

interface OpeningItemProps {
  opening: Opening;
  wall: Wall;
  isSelected: boolean;
  draggable: boolean;
  px: number;
  register: (id: string, node: Konva.Group | null) => void;
}

const OpeningItem = memo(function OpeningItem({
  opening,
  wall,
  isSelected,
  draggable,
  px,
  register,
}: OpeningItemProps) {
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

  return (
    <Group
      ref={(node) => register(opening.id, node)}
      x={x}
      y={y}
      rotation={angleDeg}
      draggable={draggable}
      onClick={select}
      onTap={select}
      onDragEnd={(e) => settle(e.target, {})}
      onTransformEnd={(e) => {
        const width = Math.round(
          Math.max(300, Math.min(3000, opening.width * Math.abs(e.target.scaleX()))),
        );
        settle(e.target, { width });
      }}
    >
      {opening.kind === "door" ? (
        <Door opening={opening} wall={wall} px={px} />
      ) : (
        <Window opening={opening} wall={wall} />
      )}
      {isSelected && (
        <Rect
          x={-opening.width / 2}
          y={-wall.thickness / 2}
          width={opening.width}
          height={wall.thickness}
          stroke="#52525b"
          strokeWidth={2}
          strokeScaleEnabled={false}
          listening={false}
          {...flat}
        />
      )}
    </Group>
  );
});

export const OpeningShapes = memo(function OpeningShapes() {
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const zoom = useEditorStore((s) => s.zoom);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);

  const px = 1 / (zoom * PX_PER_MM);
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
            px={px}
            register={register}
          />
        );
      })}
      <Transformer
        ref={transformerRef}
        rotateEnabled={false}
        enabledAnchors={["middle-left", "middle-right"]}
        borderStroke="#52525b"
        borderStrokeWidth={2}
        anchorFill="#52525b"
        anchorStroke="#ffffff"
        anchorSize={10}
        anchorCornerRadius={2}
        keepRatio={false}
        boundBoxFunc={(oldBox, newBox) => (newBox.width < 20 ? oldBox : newBox)}
      />
    </>
  );
});
