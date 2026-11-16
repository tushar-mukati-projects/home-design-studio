import { Group, Rect } from "react-konva";
import { chairShape, drawersShape, type ShapeKit } from "./furniture-shape-kit";
import { HAIRLINE } from "./konva";
import type { ReactElement } from "react";

const MONITOR_MAX_MM = 600;
const MONITOR_RATIO = 0.4;
const MONITOR_INSET_MM = 60;
const MONITOR_DEPTH_MM = 40;
const MONITOR_RADIUS_MM = 8;
const KEYBOARD_RADIUS_MM = 15;

export const officeShape = (item: string, k: ShapeKit): ReactElement | null => {
  switch (item) {
    case "desk":
    case "office-desk":
      return deskShape(k);
    case "office-chair":
      return chairShape(k, true);
    case "filing-cabinet":
      return drawersShape(k);
    default:
      return null;
  }
};

const deskShape = (k: ShapeKit) => {
  const monitorW = Math.min(MONITOR_MAX_MM, k.w * MONITOR_RATIO);
  return (
    <Group>
      {k.body()}
      <Rect
        x={-monitorW / 2}
        y={-k.hd + MONITOR_INSET_MM}
        width={monitorW}
        height={MONITOR_DEPTH_MM}
        fill={k.edge}
        cornerRadius={MONITOR_RADIUS_MM}
        {...HAIRLINE}
      />
      <Rect
        x={-monitorW * 0.4}
        y={-k.hd + k.d * 0.42}
        width={monitorW * 0.8}
        height={k.d * 0.18}
        fill={k.light}
        stroke={k.edge}
        strokeWidth={1}
        cornerRadius={KEYBOARD_RADIUS_MM}
        {...HAIRLINE}
      />
    </Group>
  );
};
