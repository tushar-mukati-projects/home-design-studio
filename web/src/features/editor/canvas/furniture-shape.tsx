"use client";

import { memo } from "react";
import { Rect, Circle, Ellipse, Line, Group } from "react-konva";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;
const detail = { strokeScaleEnabled: false, listening: false, ...flat } as const;

const shade = (hex: string, amount: number): string => {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const channel = (i: number) => {
    const v = parseInt(c.slice(i, i + 2), 16);
    const out = amount < 0 ? v * (1 + amount) : v + (255 - v) * amount;
    return Math.round(Math.max(0, Math.min(255, out)))
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(2)}${channel(4)}`;
};

interface FurnitureShapeProps {
  item: string;
  width: number;
  depth: number;
  color: string;
}

export const FurnitureShape = memo(function FurnitureShape({
  item,
  width: w,
  depth: d,
  color,
}: FurnitureShapeProps) {
  const hw = w / 2;
  const hd = d / 2;
  const dark = shade(color, -0.2);
  const light = shade(color, 0.4);
  const edge = shade(color, -0.45);
  const min = Math.min(w, d);

  const body = (radius = 30, fill = color) => (
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
      {...flat}
    />
  );
  const inset = (by: number, radius = 20, fill?: string) => (
    <Rect
      x={-hw + by}
      y={-hd + by}
      width={w - by * 2}
      height={d - by * 2}
      fill={fill}
      stroke={edge}
      strokeWidth={1}
      cornerRadius={radius}
      {...detail}
    />
  );
  const stroke = (points: number[], width = 1) => (
    <Line key={points.join()} points={points} stroke={edge} strokeWidth={width} {...detail} />
  );
  const knob = (x: number, y: number, r = 25) => (
    <Circle key={`${x},${y}`} x={x} y={y} radius={r} fill={dark} {...detail} />
  );

  switch (item) {
    case "sofa":
    case "armchair": {
      const back = d * 0.22;
      const arm = item === "sofa" ? w * 0.09 : w * 0.15;
      const seats = item === "sofa" ? (w >= 1800 ? 3 : 2) : 1;
      return (
        <Group>
          {body(60)}
          <Rect
            x={-hw}
            y={-hd}
            width={w}
            height={back}
            fill={dark}
            cornerRadius={[60, 60, 0, 0]}
            {...detail}
          />
          <Rect
            x={-hw}
            y={-hd}
            width={arm}
            height={d}
            fill={dark}
            cornerRadius={[60, 0, 0, 60]}
            {...detail}
          />
          <Rect
            x={hw - arm}
            y={-hd}
            width={arm}
            height={d}
            fill={dark}
            cornerRadius={[0, 60, 60, 0]}
            {...detail}
          />
          {Array.from({ length: seats - 1 }, (_, i) => {
            const x = -hw + arm + ((i + 1) * (w - arm * 2)) / seats;
            return stroke([x, -hd + back, x, hd - d * 0.1]);
          })}
        </Group>
      );
    }

    case "dining-chair":
    case "office-chair": {
      const back = d * 0.2;
      return (
        <Group>
          {body(item === "office-chair" ? min * 0.3 : 50)}
          <Rect
            x={-hw}
            y={-hd}
            width={w}
            height={back}
            fill={dark}
            cornerRadius={[50, 50, 0, 0]}
            {...detail}
          />
        </Group>
      );
    }

    case "coffee-table":
    case "dining-table":
    case "kitchen-island":
      return (
        <Group>
          {body(item === "kitchen-island" ? 20 : 80)}
          {inset(min * 0.1, 50)}
        </Group>
      );

    case "desk":
    case "office-desk": {
      const monitorW = Math.min(600, w * 0.4);
      return (
        <Group>
          {body(30)}
          <Rect
            x={-monitorW / 2}
            y={-hd + 60}
            width={monitorW}
            height={40}
            fill={edge}
            cornerRadius={8}
            {...detail}
          />
          <Rect
            x={-monitorW * 0.4}
            y={-hd + d * 0.42}
            width={monitorW * 0.8}
            height={d * 0.18}
            fill={light}
            stroke={edge}
            strokeWidth={1}
            cornerRadius={15}
            {...detail}
          />
        </Group>
      );
    }

    case "tv-stand":
      return (
        <Group>
          {body(20)}
          <Rect
            x={-w * 0.4}
            y={-hd - 30}
            width={w * 0.8}
            height={40}
            fill={edge}
            cornerRadius={6}
            {...detail}
          />
          {stroke([0, -hd, 0, hd])}
        </Group>
      );

    case "bookshelf":
    case "bookcase":
      return (
        <Group>
          {body(10)}
          {stroke([-hw, 0, hw, 0])}
          {[0.25, 0.5, 0.75].map((f) => stroke([-hw + w * f, -hd, -hw + w * f, hd]))}
        </Group>
      );

    case "floor-lamp":
      return (
        <Group>
          <Circle
            radius={min / 2}
            fill={color}
            stroke={edge}
            strokeWidth={1}
            strokeScaleEnabled={false}
            {...flat}
          />
          <Circle radius={min * 0.16} fill={dark} {...detail} />
        </Group>
      );

    case "double-bed":
    case "single-bed": {
      const head = d * 0.06;
      const pillowH = d * 0.14;
      const pillows = item === "double-bed" ? [-w * 0.24, w * 0.24] : [0];
      const pillowW = item === "double-bed" ? w * 0.4 : w * 0.6;
      const blanketY = -hd + head + pillowH + d * 0.12;
      return (
        <Group>
          {body(40, light)}
          <Rect
            x={-hw}
            y={-hd}
            width={w}
            height={head}
            fill={edge}
            cornerRadius={[40, 40, 0, 0]}
            {...detail}
          />
          <Rect
            x={-hw}
            y={blanketY}
            width={w}
            height={hd - blanketY}
            fill={color}
            stroke={edge}
            strokeWidth={1}
            cornerRadius={[0, 0, 40, 40]}
            {...detail}
          />
          {stroke([-hw, blanketY + d * 0.08, hw, blanketY + d * 0.08])}
          {pillows.map((x) => (
            <Rect
              key={x}
              x={x - pillowW / 2}
              y={-hd + head + d * 0.05}
              width={pillowW}
              height={pillowH}
              fill="#ffffff"
              stroke={edge}
              strokeWidth={1}
              cornerRadius={30}
              {...detail}
            />
          ))}
        </Group>
      );
    }

    case "nightstand":
      return (
        <Group>
          {body(20)}
          {knob(0, 0)}
        </Group>
      );

    case "dresser":
    case "filing-cabinet":
      return (
        <Group>
          {body(15)}
          {stroke([-hw, 0, hw, 0])}
          {knob(-w * 0.25, 0, 22)}
          {knob(w * 0.25, 0, 22)}
        </Group>
      );

    case "wardrobe":
      return (
        <Group>
          {body(10)}
          {stroke([0, -hd, 0, hd])}
          {knob(-60, hd * 0.3, 20)}
          {knob(60, hd * 0.3, 20)}
        </Group>
      );

    case "refrigerator":
      return (
        <Group>
          {body(30)}
          {stroke([-hw + w * 0.4, -hd, -hw + w * 0.4, hd])}
          <Rect
            x={-hw + w * 0.4 - 70}
            y={hd - 40}
            width={50}
            height={-d * 0.5}
            fill={edge}
            cornerRadius={10}
            {...detail}
          />
          <Rect
            x={-hw + w * 0.4 + 20}
            y={hd - 40}
            width={50}
            height={-d * 0.5}
            fill={edge}
            cornerRadius={10}
            {...detail}
          />
        </Group>
      );

    case "stove": {
      const r = min * 0.14;
      return (
        <Group>
          {body(20)}
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sy) => (
              <Circle
                key={`${sx}${sy}`}
                x={sx * w * 0.24}
                y={sy * d * 0.24}
                radius={r}
                stroke={edge}
                strokeWidth={1.5}
                fill={dark}
                {...detail}
              />
            )),
          )}
        </Group>
      );
    }

    case "bathtub":
      return (
        <Group>
          {body(min * 0.18)}
          {inset(min * 0.12, min * 0.14, light)}
          <Circle x={-hw + min * 0.3} y={0} radius={40} fill={dark} {...detail} />
        </Group>
      );

    case "toilet":
      return (
        <Group>
          <Rect
            x={-hw}
            y={-hd}
            width={w}
            height={d * 0.32}
            fill={dark}
            stroke={edge}
            strokeWidth={1}
            cornerRadius={30}
            {...flat}
            strokeScaleEnabled={false}
          />
          <Ellipse
            x={0}
            y={hd - d * 0.34}
            radiusX={w * 0.42}
            radiusY={d * 0.34}
            fill={color}
            stroke={edge}
            strokeWidth={1}
            strokeScaleEnabled={false}
            {...flat}
          />
          <Ellipse
            x={0}
            y={hd - d * 0.34}
            radiusX={w * 0.28}
            radiusY={d * 0.22}
            fill={light}
            {...detail}
          />
        </Group>
      );

    case "sink":
      return (
        <Group>
          {body(30)}
          <Ellipse
            x={0}
            y={d * 0.06}
            radiusX={w * 0.34}
            radiusY={d * 0.3}
            fill={light}
            stroke={edge}
            strokeWidth={1}
            {...detail}
          />
          {knob(0, -hd + d * 0.16, 25)}
        </Group>
      );

    case "shower":
      return (
        <Group>
          {body(30)}
          {inset(min * 0.08, 15)}
          <Circle radius={45} stroke={edge} strokeWidth={1.5} {...detail} />
          {stroke([-hw + min * 0.08, -hd + min * 0.08, -min * 0.12, -min * 0.12])}
        </Group>
      );

    default:
      return <Group>{body(30)}</Group>;
  }
});
