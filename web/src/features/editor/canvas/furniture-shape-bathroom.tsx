import { Circle, Ellipse, Group, Rect } from "react-konva";
import type { ShapeKit } from "./furniture-shape-kit";
import { FLAT, HAIRLINE } from "./konva";
import type { ReactElement } from "react";

const TUB_RADIUS_RATIO = 0.18;
const TUB_INSET_RATIO = 0.12;
const TUB_INSET_RADIUS_RATIO = 0.14;
const TUB_DRAIN_X_RATIO = 0.3;
const TUB_DRAIN_MM = 40;
const TANK_DEPTH_RATIO = 0.32;
const TANK_RADIUS_MM = 30;
const BOWL_Y_RATIO = 0.34;
const SINK_KNOB_Y_RATIO = 0.16;
const SHOWER_INSET_RATIO = 0.08;
const SHOWER_INSET_RADIUS_MM = 15;
const SHOWER_DRAIN_MM = 45;
const SHOWER_STROKE_PX = 1.5;

export const bathroomShape = (item: string, k: ShapeKit): ReactElement | null => {
  switch (item) {
    case "bathtub":
      return (
        <Group>
          {k.body(k.min * TUB_RADIUS_RATIO)}
          {k.inset(k.min * TUB_INSET_RATIO, k.min * TUB_INSET_RADIUS_RATIO, k.light)}
          <Circle
            x={-k.hw + k.min * TUB_DRAIN_X_RATIO}
            y={0}
            radius={TUB_DRAIN_MM}
            fill={k.dark}
            {...HAIRLINE}
          />
        </Group>
      );
    case "toilet":
      return toiletShape(k);
    case "sink":
      return sinkShape(k);
    case "shower":
      return showerShape(k);
    default:
      return null;
  }
};

const toiletShape = (k: ShapeKit) => {
  const bowlY = k.hd - k.d * BOWL_Y_RATIO;
  return (
    <Group>
      <Rect
        x={-k.hw}
        y={-k.hd}
        width={k.w}
        height={k.d * TANK_DEPTH_RATIO}
        fill={k.dark}
        stroke={k.edge}
        strokeWidth={1}
        cornerRadius={TANK_RADIUS_MM}
        {...FLAT}
        strokeScaleEnabled={false}
      />
      <Ellipse
        x={0}
        y={bowlY}
        radiusX={k.w * 0.42}
        radiusY={k.d * BOWL_Y_RATIO}
        fill={k.color}
        stroke={k.edge}
        strokeWidth={1}
        strokeScaleEnabled={false}
        {...FLAT}
      />
      <Ellipse
        x={0}
        y={bowlY}
        radiusX={k.w * 0.28}
        radiusY={k.d * 0.22}
        fill={k.light}
        {...HAIRLINE}
      />
    </Group>
  );
};

const sinkShape = (k: ShapeKit) => (
  <Group>
    {k.body()}
    <Ellipse
      x={0}
      y={k.d * 0.06}
      radiusX={k.w * 0.34}
      radiusY={k.d * 0.3}
      fill={k.light}
      stroke={k.edge}
      strokeWidth={1}
      {...HAIRLINE}
    />
    {k.knob(0, -k.hd + k.d * SINK_KNOB_Y_RATIO)}
  </Group>
);

const showerShape = (k: ShapeKit) => {
  const inset = k.min * SHOWER_INSET_RATIO;
  return (
    <Group>
      {k.body()}
      {k.inset(inset, SHOWER_INSET_RADIUS_MM)}
      <Circle
        radius={SHOWER_DRAIN_MM}
        stroke={k.edge}
        strokeWidth={SHOWER_STROKE_PX}
        {...HAIRLINE}
      />
      {k.stroke([-k.hw + inset, -k.hd + inset, -k.min * 0.12, -k.min * 0.12])}
    </Group>
  );
};
