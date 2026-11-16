"use client";

import { Group, Line, Rect, Shape } from "react-konva";
import { FLAT, HAIRLINE } from "./konva";
import {
  DOOR_LEAF,
  DOOR_LEAF_EDGE,
  DOOR_SWING,
  JAMB,
  OPENING_GAP,
  TRANSPARENT,
  WINDOW_FRAME,
  WINDOW_GLASS,
} from "./palette";
import type { ReactNode } from "react";
import type { Opening, Wall } from "@/shared/canvas";

const GAP_OVERHANG_MM = 2;
const JAMB_STROKE_PX = 2;
const SWING_STROKE_PX = 1;
const LEAF_THICKNESS_MM = 40;
const SLIDING_LEAF_OVERLAP_MM = 60;
const SLIDING_LEAF_INNER_MM = 25;
const SLIDING_LEAF_OUTER_MM = 65;
const SLIDING_ARROW_GAP_MM = 70;
const SLIDING_ARROW_HEAD_MM = 40;
const WINDOW_GLASS_MIN_MM = 30;
const WINDOW_GLASS_RATIO = 0.3;
const WINDOW_FRAME_STROKE_PX = 1.5;

type OpeningShapeProps = {
  opening: Opening;
  wall: Wall;
};

type OpeningGapProps = OpeningShapeProps & {
  children?: ReactNode;
};

type Leaf = [hingeX: number, direction: 1 | -1];

export const DoorShape = ({ opening, wall }: OpeningShapeProps) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  const side = opening.swing === "out" ? -1 : 1;
  const double = opening.variant === "double";
  const leafLength = double ? half : opening.width;
  const leaves: Leaf[] = double
    ? [
        [-half, 1],
        [half, -1],
      ]
    : opening.hinge === "right"
      ? [[half, -1]]
      : [[-half, 1]];

  return (
    <>
      <OpeningGap opening={opening} wall={wall}>
        <Rect
          x={-half}
          y={side > 0 ? 0 : -opening.width}
          width={opening.width}
          height={opening.width}
          fill={TRANSPARENT}
          {...FLAT}
        />
      </OpeningGap>
      {leaves.map(([hx, dir]) => (
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
            stroke={DOOR_SWING}
            strokeWidth={SWING_STROKE_PX}
            {...HAIRLINE}
          />
          <Rect
            x={-LEAF_THICKNESS_MM / 2}
            y={Math.min(0, side * leafLength)}
            width={LEAF_THICKNESS_MM}
            height={leafLength}
            fill={DOOR_LEAF}
            stroke={DOOR_LEAF_EDGE}
            strokeWidth={1}
            {...HAIRLINE}
          />
        </Group>
      ))}
    </>
  );
};

export const SlidingDoorShape = ({ opening, wall }: OpeningShapeProps) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  const side = opening.swing === "out" ? -1 : 1;
  const dir = opening.hinge === "right" ? -1 : 1;
  const leaf = { fill: DOOR_LEAF, stroke: DOOR_LEAF_EDGE, strokeWidth: 1, ...HAIRLINE };
  const arrowY = side * (t + SLIDING_ARROW_GAP_MM);
  const swing = { stroke: DOOR_SWING, strokeWidth: SWING_STROKE_PX, ...HAIRLINE };

  return (
    <>
      <OpeningGap opening={opening} wall={wall} />
      <Rect
        x={dir > 0 ? -half : 0}
        y={-LEAF_THICKNESS_MM / 2}
        width={half}
        height={LEAF_THICKNESS_MM}
        {...leaf}
      />
      <Rect
        x={dir > 0 ? -SLIDING_LEAF_OVERLAP_MM : -half + SLIDING_LEAF_OVERLAP_MM}
        y={side > 0 ? SLIDING_LEAF_INNER_MM : -SLIDING_LEAF_OUTER_MM}
        width={half}
        height={LEAF_THICKNESS_MM}
        {...leaf}
      />
      <Line points={[dir * -half * 0.1, arrowY, dir * half * 0.7, arrowY]} {...swing} />
      <Line
        points={[
          dir * half * 0.5,
          arrowY - SLIDING_ARROW_HEAD_MM,
          dir * half * 0.7,
          arrowY,
          dir * half * 0.5,
          arrowY + SLIDING_ARROW_HEAD_MM,
        ]}
        {...swing}
      />
    </>
  );
};

export const WindowShape = ({ opening, wall }: OpeningShapeProps) => {
  const half = opening.width / 2;
  const g = Math.max(WINDOW_GLASS_MIN_MM, wall.thickness * WINDOW_GLASS_RATIO);
  const frame = { stroke: WINDOW_FRAME, strokeWidth: WINDOW_FRAME_STROKE_PX, ...HAIRLINE };

  return (
    <OpeningGap opening={opening} wall={wall}>
      <Rect
        x={-half}
        y={-g / 2}
        width={opening.width}
        height={g}
        fill={WINDOW_GLASS}
        {...HAIRLINE}
      />
      <Line points={[-half, -g / 2, half, -g / 2]} {...frame} />
      <Line points={[-half, g / 2, half, g / 2]} {...frame} />
      <Line points={[0, -g / 2, 0, g / 2]} {...frame} />
    </OpeningGap>
  );
};

const OpeningGap = ({ opening, wall, children }: OpeningGapProps) => {
  const half = opening.width / 2;
  const t = wall.thickness / 2;
  return (
    <>
      <Rect
        x={-half}
        y={-t - GAP_OVERHANG_MM}
        width={opening.width}
        height={wall.thickness + GAP_OVERHANG_MM * 2}
        fill={OPENING_GAP}
        {...FLAT}
      />
      {children}
      {[-half, half].map((x) => (
        <Line
          key={x}
          points={[x, -t, x, t]}
          stroke={JAMB}
          strokeWidth={JAMB_STROKE_PX}
          {...HAIRLINE}
        />
      ))}
    </>
  );
};
