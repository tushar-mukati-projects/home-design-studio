import { Circle, Group, Rect } from "react-konva";
import { chairShape, tableShape, type ShapeKit } from "./furniture-shape-kit";
import { HAIRLINE } from "./konva";
import type { ReactElement } from "react";

const FRIDGE_DOOR_RATIO = 0.4;
const FRIDGE_HANDLE_MM = 50;
const FRIDGE_HANDLE_INSET_MM = 40;
const FRIDGE_HANDLE_GAP_MM = 20;
const FRIDGE_HANDLE_RADIUS_MM = 10;
const STOVE_RADIUS_MM = 20;
const BURNER_RATIO = 0.14;
const BURNER_SPREAD_RATIO = 0.24;
const BURNER_STROKE_PX = 1.5;

export const kitchenShape = (item: string, k: ShapeKit): ReactElement | null => {
  switch (item) {
    case "dining-table":
      return tableShape(k, false);
    case "kitchen-island":
      return tableShape(k, true);
    case "dining-chair":
      return chairShape(k, false);
    case "refrigerator":
      return fridgeShape(k);
    case "stove":
      return stoveShape(k);
    default:
      return null;
  }
};

const fridgeShape = (k: ShapeKit) => {
  const split = -k.hw + k.w * FRIDGE_DOOR_RATIO;
  const handle = (x: number) => (
    <Rect
      x={x}
      y={k.hd - FRIDGE_HANDLE_INSET_MM}
      width={FRIDGE_HANDLE_MM}
      height={-k.d * 0.5}
      fill={k.edge}
      cornerRadius={FRIDGE_HANDLE_RADIUS_MM}
      {...HAIRLINE}
    />
  );
  return (
    <Group>
      {k.body()}
      {k.stroke([split, -k.hd, split, k.hd])}
      {handle(split - FRIDGE_HANDLE_MM - FRIDGE_HANDLE_GAP_MM)}
      {handle(split + FRIDGE_HANDLE_GAP_MM)}
    </Group>
  );
};

const stoveShape = (k: ShapeKit) => (
  <Group>
    {k.body(STOVE_RADIUS_MM)}
    {[-1, 1].flatMap((sx) =>
      [-1, 1].map((sy) => (
        <Circle
          key={`${sx}${sy}`}
          x={sx * k.w * BURNER_SPREAD_RATIO}
          y={sy * k.d * BURNER_SPREAD_RATIO}
          radius={k.min * BURNER_RATIO}
          stroke={k.edge}
          strokeWidth={BURNER_STROKE_PX}
          fill={k.dark}
          {...HAIRLINE}
        />
      )),
    )}
  </Group>
);
