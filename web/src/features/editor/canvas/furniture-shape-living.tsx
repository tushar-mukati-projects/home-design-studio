import { Circle, Group, Rect } from "react-konva";
import { tableShape, type ShapeKit } from "./furniture-shape-kit";
import { FLAT, HAIRLINE } from "./konva";
import type { ReactElement } from "react";

const SEAT_RADIUS_MM = 60;
const SEAT_BACK_RATIO = 0.22;
const SOFA_ARM_RATIO = 0.09;
const ARMCHAIR_ARM_RATIO = 0.15;
const THREE_SEAT_MIN_MM = 1800;
const SEAT_FRONT_RATIO = 0.1;
const TV_RADIUS_MM = 20;
const TV_SCREEN_MM = 40;
const TV_SCREEN_OFFSET_MM = 30;
const TV_SCREEN_RADIUS_MM = 6;
const SHELF_RADIUS_MM = 10;
const LAMP_CORE_RATIO = 0.16;

export const livingRoomShape = (item: string, k: ShapeKit): ReactElement | null => {
  switch (item) {
    case "sofa":
    case "armchair":
      return seatingShape(k, item === "sofa");
    case "coffee-table":
      return tableShape(k, false);
    case "tv-stand":
      return tvStandShape(k);
    case "bookshelf":
    case "bookcase":
      return shelfShape(k);
    case "floor-lamp":
      return lampShape(k);
    default:
      return null;
  }
};

const seatingShape = (k: ShapeKit, sofa: boolean) => {
  const back = k.d * SEAT_BACK_RATIO;
  const arm = k.w * (sofa ? SOFA_ARM_RATIO : ARMCHAIR_ARM_RATIO);
  const seats = sofa ? (k.w >= THREE_SEAT_MIN_MM ? 3 : 2) : 1;
  const r = SEAT_RADIUS_MM;
  return (
    <Group>
      {k.body(r)}
      <Rect
        x={-k.hw}
        y={-k.hd}
        width={k.w}
        height={back}
        fill={k.dark}
        cornerRadius={[r, r, 0, 0]}
        {...HAIRLINE}
      />
      <Rect
        x={-k.hw}
        y={-k.hd}
        width={arm}
        height={k.d}
        fill={k.dark}
        cornerRadius={[r, 0, 0, r]}
        {...HAIRLINE}
      />
      <Rect
        x={k.hw - arm}
        y={-k.hd}
        width={arm}
        height={k.d}
        fill={k.dark}
        cornerRadius={[0, r, r, 0]}
        {...HAIRLINE}
      />
      {Array.from({ length: seats - 1 }, (_, i) => {
        const x = -k.hw + arm + ((i + 1) * (k.w - arm * 2)) / seats;
        return k.stroke([x, -k.hd + back, x, k.hd - k.d * SEAT_FRONT_RATIO]);
      })}
    </Group>
  );
};

const tvStandShape = (k: ShapeKit) => (
  <Group>
    {k.body(TV_RADIUS_MM)}
    <Rect
      x={-k.w * 0.4}
      y={-k.hd - TV_SCREEN_OFFSET_MM}
      width={k.w * 0.8}
      height={TV_SCREEN_MM}
      fill={k.edge}
      cornerRadius={TV_SCREEN_RADIUS_MM}
      {...HAIRLINE}
    />
    {k.stroke([0, -k.hd, 0, k.hd])}
  </Group>
);

const shelfShape = (k: ShapeKit) => (
  <Group>
    {k.body(SHELF_RADIUS_MM)}
    {k.stroke([-k.hw, 0, k.hw, 0])}
    {[0.25, 0.5, 0.75].map((f) => k.stroke([-k.hw + k.w * f, -k.hd, -k.hw + k.w * f, k.hd]))}
  </Group>
);

const lampShape = (k: ShapeKit) => (
  <Group>
    <Circle
      radius={k.min / 2}
      fill={k.color}
      stroke={k.edge}
      strokeWidth={1}
      strokeScaleEnabled={false}
      {...FLAT}
    />
    <Circle radius={k.min * LAMP_CORE_RATIO} fill={k.dark} {...HAIRLINE} />
  </Group>
);
