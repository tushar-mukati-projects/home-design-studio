import { Group, Rect } from "react-konva";
import { drawersShape, type ShapeKit } from "./furniture-shape-kit";
import { HAIRLINE } from "./konva";
import { FURNITURE_PILLOW } from "./palette";
import type { ReactElement } from "react";

const BED_RADIUS_MM = 40;
const HEADBOARD_RATIO = 0.06;
const PILLOW_DEPTH_RATIO = 0.14;
const PILLOW_GAP_RATIO = 0.05;
const PILLOW_RADIUS_MM = 30;
const BLANKET_GAP_RATIO = 0.12;
const BLANKET_FOLD_RATIO = 0.08;
const NIGHTSTAND_RADIUS_MM = 20;
const WARDROBE_RADIUS_MM = 10;
const WARDROBE_KNOB_X_MM = 60;
const WARDROBE_KNOB_MM = 20;

export const bedroomShape = (item: string, k: ShapeKit): ReactElement | null => {
  switch (item) {
    case "double-bed":
    case "single-bed":
      return bedShape(k, item === "double-bed");
    case "nightstand":
      return (
        <Group>
          {k.body(NIGHTSTAND_RADIUS_MM)}
          {k.knob(0, 0)}
        </Group>
      );
    case "wardrobe":
      return (
        <Group>
          {k.body(WARDROBE_RADIUS_MM)}
          {k.stroke([0, -k.hd, 0, k.hd])}
          {k.knob(-WARDROBE_KNOB_X_MM, k.hd * 0.3, WARDROBE_KNOB_MM)}
          {k.knob(WARDROBE_KNOB_X_MM, k.hd * 0.3, WARDROBE_KNOB_MM)}
        </Group>
      );
    case "dresser":
      return drawersShape(k);
    default:
      return null;
  }
};

const bedShape = (k: ShapeKit, double: boolean) => {
  const head = k.d * HEADBOARD_RATIO;
  const pillowH = k.d * PILLOW_DEPTH_RATIO;
  const pillows = double ? [-k.w * 0.24, k.w * 0.24] : [0];
  const pillowW = double ? k.w * 0.4 : k.w * 0.6;
  const blanketY = -k.hd + head + pillowH + k.d * BLANKET_GAP_RATIO;
  const r = BED_RADIUS_MM;
  return (
    <Group>
      {k.body(r, k.light)}
      <Rect
        x={-k.hw}
        y={-k.hd}
        width={k.w}
        height={head}
        fill={k.edge}
        cornerRadius={[r, r, 0, 0]}
        {...HAIRLINE}
      />
      <Rect
        x={-k.hw}
        y={blanketY}
        width={k.w}
        height={k.hd - blanketY}
        fill={k.color}
        stroke={k.edge}
        strokeWidth={1}
        cornerRadius={[0, 0, r, r]}
        {...HAIRLINE}
      />
      {k.stroke([
        -k.hw,
        blanketY + k.d * BLANKET_FOLD_RATIO,
        k.hw,
        blanketY + k.d * BLANKET_FOLD_RATIO,
      ])}
      {pillows.map((x) => (
        <Rect
          key={x}
          x={x - pillowW / 2}
          y={-k.hd + head + k.d * PILLOW_GAP_RATIO}
          width={pillowW}
          height={pillowH}
          fill={FURNITURE_PILLOW}
          stroke={k.edge}
          strokeWidth={1}
          cornerRadius={PILLOW_RADIUS_MM}
          {...HAIRLINE}
        />
      ))}
    </Group>
  );
};
