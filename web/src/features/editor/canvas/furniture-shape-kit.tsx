import { Circle, Group, Line, Rect } from "react-konva";
import { shade } from "@/lib/colors";
import { FLAT, HAIRLINE } from "./konva";
import type { ReactElement } from "react";

const DARK_SHADE = -0.2;
const LIGHT_SHADE = 0.4;
const EDGE_SHADE = -0.45;
const BODY_RADIUS_MM = 30;
const INSET_RADIUS_MM = 20;
const KNOB_RADIUS_MM = 25;
const CHAIR_BACK_RATIO = 0.2;
const CHAIR_RADIUS_MM = 50;
const OFFICE_CHAIR_RADIUS_RATIO = 0.3;
const TABLE_RADIUS_MM = 80;
const ISLAND_RADIUS_MM = 20;
const TABLE_INSET_RATIO = 0.1;
const TABLE_INSET_RADIUS_MM = 50;
const DRAWERS_RADIUS_MM = 15;
const DRAWER_KNOB_MM = 22;

export type ShapeKit = {
  w: number;
  d: number;
  hw: number;
  hd: number;
  min: number;
  color: string;
  dark: string;
  light: string;
  edge: string;
  body: (radius?: number, fill?: string) => ReactElement;
  inset: (by: number, radius?: number, fill?: string) => ReactElement;
  stroke: (points: number[], width?: number) => ReactElement;
  knob: (x: number, y: number, r?: number) => ReactElement;
};

export const makeShapeKit = (w: number, d: number, color: string): ShapeKit => {
  const hw = w / 2;
  const hd = d / 2;
  const edge = shade(color, EDGE_SHADE);
  const dark = shade(color, DARK_SHADE);
  return {
    w,
    d,
    hw,
    hd,
    min: Math.min(w, d),
    color,
    dark,
    light: shade(color, LIGHT_SHADE),
    edge,
    body: (radius = BODY_RADIUS_MM, fill = color) => (
      <Rect
        x={-hw}
        y={-hd}
        width={w}
        height={d}
        fill={fill}
        stroke={edge}
        strokeWidth={1}
        strokeScaleEnabled={false}
        cornerRadius={radius}
        {...FLAT}
      />
    ),
    inset: (by, radius = INSET_RADIUS_MM, fill) => (
      <Rect
        x={-hw + by}
        y={-hd + by}
        width={w - by * 2}
        height={d - by * 2}
        fill={fill}
        stroke={edge}
        strokeWidth={1}
        cornerRadius={radius}
        {...HAIRLINE}
      />
    ),
    stroke: (points, width = 1) => (
      <Line key={points.join()} points={points} stroke={edge} strokeWidth={width} {...HAIRLINE} />
    ),
    knob: (x, y, r = KNOB_RADIUS_MM) => (
      <Circle key={`${x},${y}`} x={x} y={y} radius={r} fill={dark} {...HAIRLINE} />
    ),
  };
};

export const chairShape = (k: ShapeKit, office: boolean) => (
  <Group>
    {k.body(office ? k.min * OFFICE_CHAIR_RADIUS_RATIO : CHAIR_RADIUS_MM)}
    <Rect
      x={-k.hw}
      y={-k.hd}
      width={k.w}
      height={k.d * CHAIR_BACK_RATIO}
      fill={k.dark}
      cornerRadius={[CHAIR_RADIUS_MM, CHAIR_RADIUS_MM, 0, 0]}
      {...HAIRLINE}
    />
  </Group>
);

export const tableShape = (k: ShapeKit, island: boolean) => (
  <Group>
    {k.body(island ? ISLAND_RADIUS_MM : TABLE_RADIUS_MM)}
    {k.inset(k.min * TABLE_INSET_RATIO, TABLE_INSET_RADIUS_MM)}
  </Group>
);

export const drawersShape = (k: ShapeKit) => (
  <Group>
    {k.body(DRAWERS_RADIUS_MM)}
    {k.stroke([-k.hw, 0, k.hw, 0])}
    {k.knob(-k.w * 0.25, 0, DRAWER_KNOB_MM)}
    {k.knob(k.w * 0.25, 0, DRAWER_KNOB_MM)}
  </Group>
);
