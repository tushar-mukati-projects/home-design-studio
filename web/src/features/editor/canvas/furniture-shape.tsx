"use client";

import { memo } from "react";
import { Rect, Circle, Line, Shape, Group } from "react-konva";

function darkenColor(hex: string, amount = 0.15): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const r = Math.max(0, Math.round(parseInt(c.substring(0, 2), 16) * (1 - amount)));
  const g = Math.max(0, Math.round(parseInt(c.substring(2, 4), 16) * (1 - amount)));
  const b = Math.max(0, Math.round(parseInt(c.substring(4, 6), 16) * (1 - amount)));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

interface FurnitureShapeProps {
  furnitureId: string;
  width: number;
  height: number;
  color: string;
}

export const FurnitureShape = memo(function FurnitureShape({
  furnitureId,
  width: w,
  height: h,
  color,
}: FurnitureShapeProps) {
  const dark = darkenColor(color);
  const hw = w / 2;
  const hh = h / 2;

  switch (furnitureId) {
    /* ───────── LIVING ROOM ───────── */

    case "sofa": {
      const backH = h * 0.15;
      const cushions = w > 120 ? 3 : 2;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={3} />
          <Rect x={-hw} y={-hh} width={w} height={backH} fill={dark} cornerRadius={[3, 3, 0, 0]} />
          {Array.from({ length: cushions - 1 }, (_, i) => {
            const lx = -hw + ((i + 1) * w) / cushions;
            return (
              <Line
                key={i}
                points={[lx, -hh + backH + 4, lx, hh - 4]}
                stroke={dark}
                strokeWidth={1}
                listening={false}
              />
            );
          })}
        </Group>
      );
    }

    case "armchair": {
      const backH = h * 0.15;
      const armW = w * 0.12;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={3} />
          <Rect x={-hw} y={-hh} width={w} height={backH} fill={dark} cornerRadius={[3, 3, 0, 0]} />
          <Rect x={-hw} y={-hh} width={armW} height={h} fill={dark} cornerRadius={[3, 0, 0, 3]} />
          <Rect
            x={hw - armW}
            y={-hh}
            width={armW}
            height={h}
            fill={dark}
            cornerRadius={[0, 3, 3, 0]}
          />
        </Group>
      );
    }

    case "coffee-table": {
      const legR = Math.min(4, w * 0.05);
      const inset = legR + 3;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={6} />
          <Circle x={-hw + inset} y={-hh + inset} radius={legR} fill={dark} />
          <Circle x={hw - inset} y={-hh + inset} radius={legR} fill={dark} />
          <Circle x={-hw + inset} y={hh - inset} radius={legR} fill={dark} />
          <Circle x={hw - inset} y={hh - inset} radius={legR} fill={dark} />
        </Group>
      );
    }

    case "tv-stand": {
      const tvH = Math.max(4, h * 0.12);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Rect
            x={-hw + w * 0.1}
            y={-hh}
            width={w * 0.8}
            height={tvH}
            fill={dark}
            cornerRadius={[2, 2, 0, 0]}
          />
        </Group>
      );
    }

    case "bookshelf":
    case "bookcase": {
      const shelves = 4;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          {Array.from({ length: shelves }, (_, i) => {
            const sy = -hh + ((i + 1) * h) / (shelves + 1);
            return (
              <Line
                key={i}
                points={[-hw + 3, sy, hw - 3, sy]}
                stroke={dark}
                strokeWidth={1.5}
                listening={false}
              />
            );
          })}
        </Group>
      );
    }

    case "floor-lamp": {
      const r = Math.max(4, Math.min(hw, hh) - 2);
      return (
        <Group>
          <Circle x={0} y={0} radius={r} fill={color} />
          <Circle x={0} y={0} radius={Math.max(2, r * 0.25)} fill={dark} />
        </Group>
      );
    }

    /* ───────── BEDROOM ───────── */

    case "double-bed": {
      const headH = h * 0.1;
      const pillowW = w * 0.35;
      const pillowH = h * 0.1;
      const pillowY = -hh + headH + 6;
      const gap = w * 0.06;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={3} />
          <Rect x={-hw} y={-hh} width={w} height={headH} fill={dark} cornerRadius={[3, 3, 0, 0]} />
          <Rect
            x={-hw + gap}
            y={pillowY}
            width={pillowW}
            height={pillowH}
            fill="#ffffff"
            cornerRadius={3}
            opacity={0.6}
          />
          <Rect
            x={hw - gap - pillowW}
            y={pillowY}
            width={pillowW}
            height={pillowH}
            fill="#ffffff"
            cornerRadius={3}
            opacity={0.6}
          />
        </Group>
      );
    }

    case "single-bed": {
      const headH = h * 0.1;
      const pillowW = w * 0.6;
      const pillowH = h * 0.1;
      const pillowY = -hh + headH + 6;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={3} />
          <Rect x={-hw} y={-hh} width={w} height={headH} fill={dark} cornerRadius={[3, 3, 0, 0]} />
          <Rect
            x={-pillowW / 2}
            y={pillowY}
            width={pillowW}
            height={pillowH}
            fill="#ffffff"
            cornerRadius={3}
            opacity={0.6}
          />
        </Group>
      );
    }

    case "nightstand": {
      const handleR = Math.min(4, w * 0.08);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Circle x={0} y={0} radius={handleR} fill={dark} />
        </Group>
      );
    }

    case "wardrobe": {
      const handleR = Math.min(3, w * 0.04);
      const handleGap = Math.max(6, w * 0.08);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Line
            points={[0, -hh + 3, 0, hh - 3]}
            stroke={dark}
            strokeWidth={1.5}
            listening={false}
          />
          <Circle x={-handleGap} y={0} radius={handleR} fill={dark} />
          <Circle x={handleGap} y={0} radius={handleR} fill={dark} />
        </Group>
      );
    }

    case "dresser": {
      const handleR = Math.min(3, w * 0.04);
      const rows = 3;
      const sectionH = h / rows;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          {Array.from({ length: rows }, (_, i) => {
            const lineY = -hh + sectionH * (i + 1);
            const handleY = -hh + sectionH * i + sectionH / 2;
            return (
              <Group key={i}>
                {i < rows - 1 && (
                  <Line
                    points={[-hw + 3, lineY, hw - 3, lineY]}
                    stroke={dark}
                    strokeWidth={1}
                    listening={false}
                  />
                )}
                <Circle x={0} y={handleY} radius={handleR} fill={dark} />
              </Group>
            );
          })}
        </Group>
      );
    }

    case "desk": {
      const surfaceH = Math.max(3, h * 0.08);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Rect
            x={-hw}
            y={-hh}
            width={w}
            height={surfaceH}
            fill={dark}
            cornerRadius={[2, 2, 0, 0]}
          />
        </Group>
      );
    }

    /* ───────── KITCHEN ───────── */

    case "dining-table": {
      const legR = Math.min(4, w * 0.04);
      const inset = Math.max(8, w * 0.08);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={3} />
          <Circle x={-hw + inset} y={-hh + inset} radius={legR} fill={dark} />
          <Circle x={hw - inset} y={-hh + inset} radius={legR} fill={dark} />
          <Circle x={-hw + inset} y={hh - inset} radius={legR} fill={dark} />
          <Circle x={hw - inset} y={hh - inset} radius={legR} fill={dark} />
        </Group>
      );
    }

    case "dining-chair": {
      const backH = Math.max(4, h * 0.18);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Rect x={-hw} y={-hh} width={w} height={backH} fill={dark} cornerRadius={[2, 2, 0, 0]} />
        </Group>
      );
    }

    case "kitchen-island": {
      const inset = Math.max(4, Math.min(w, h) * 0.06);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Rect
            x={-hw + inset}
            y={-hh + inset}
            width={w - inset * 2}
            height={h - inset * 2}
            stroke={dark}
            strokeWidth={1}
            listening={false}
          />
        </Group>
      );
    }

    case "refrigerator": {
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Line
            points={[0, -hh + 3, 0, hh - 3]}
            stroke={dark}
            strokeWidth={1.5}
            listening={false}
          />
        </Group>
      );
    }

    case "stove": {
      const burnerR = Math.min(w * 0.14, h * 0.14);
      const bx = w * 0.22;
      const by = h * 0.22;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Circle
            x={-bx}
            y={-by}
            radius={burnerR}
            stroke={dark}
            strokeWidth={1.5}
            fill={darkenColor(color, 0.08)}
          />
          <Circle
            x={bx}
            y={-by}
            radius={burnerR}
            stroke={dark}
            strokeWidth={1.5}
            fill={darkenColor(color, 0.08)}
          />
          <Circle
            x={-bx}
            y={by}
            radius={burnerR}
            stroke={dark}
            strokeWidth={1.5}
            fill={darkenColor(color, 0.08)}
          />
          <Circle
            x={bx}
            y={by}
            radius={burnerR}
            stroke={dark}
            strokeWidth={1.5}
            fill={darkenColor(color, 0.08)}
          />
        </Group>
      );
    }

    /* ───────── BATHROOM ───────── */

    case "bathtub": {
      const inset = Math.min(8, Math.min(w, h) * 0.12);
      const outerR = Math.min(w, h) * 0.15;
      const innerR = Math.min(w, h) * 0.1;
      const drainR = Math.min(4, w * 0.04);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={outerR} />
          <Rect
            x={-hw + inset}
            y={-hh + inset}
            width={w - inset * 2}
            height={h - inset * 2}
            fill={darkenColor(color, 0.08)}
            cornerRadius={innerR}
          />
          <Circle x={0} y={hh - inset - drainR * 2} radius={drainR} fill={dark} />
        </Group>
      );
    }

    case "toilet": {
      const tankH = h * 0.25;
      const bowlRx = w * 0.4;
      const bowlRy = (h - tankH) * 0.42;
      const bowlCy = -hh + tankH + (h - tankH) * 0.45;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={tankH} fill={dark} cornerRadius={[3, 3, 0, 0]} />
          <Shape
            sceneFunc={(ctx, shape) => {
              ctx.beginPath();
              const kappa = 0.5522848;
              const ox = bowlRx * kappa;
              const oy = bowlRy * kappa;
              ctx.moveTo(-bowlRx, bowlCy);
              ctx.bezierCurveTo(-bowlRx, bowlCy - oy, -ox, bowlCy - bowlRy, 0, bowlCy - bowlRy);
              ctx.bezierCurveTo(ox, bowlCy - bowlRy, bowlRx, bowlCy - oy, bowlRx, bowlCy);
              ctx.bezierCurveTo(bowlRx, bowlCy + oy, ox, bowlCy + bowlRy, 0, bowlCy + bowlRy);
              ctx.bezierCurveTo(-ox, bowlCy + bowlRy, -bowlRx, bowlCy + oy, -bowlRx, bowlCy);
              ctx.closePath();
              ctx.fillStrokeShape(shape);
            }}
            fill={color}
            stroke={dark}
            strokeWidth={1}
          />
        </Group>
      );
    }

    case "sink": {
      const basinR = Math.min(w * 0.28, h * 0.28);
      const faucetR = Math.min(3, w * 0.05);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={6} />
          <Circle
            x={0}
            y={h * 0.05}
            radius={basinR}
            fill={darkenColor(color, 0.08)}
            stroke={dark}
            strokeWidth={1}
          />
          <Circle x={0} y={-hh + 6} radius={faucetR} fill={dark} />
        </Group>
      );
    }

    case "shower": {
      const showerR = Math.min(4, w * 0.06);
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Line
            points={[-hw + 6, -hh + 6, hw - 6, hh - 6]}
            stroke={dark}
            strokeWidth={1}
            opacity={0.5}
            listening={false}
          />
          <Line
            points={[hw - 6, -hh + 6, -hw + 6, hh - 6]}
            stroke={dark}
            strokeWidth={1}
            opacity={0.5}
            listening={false}
          />
          <Circle x={hw - 8} y={-hh + 8} radius={showerR} fill={dark} />
        </Group>
      );
    }

    /* ───────── OFFICE ───────── */

    case "office-desk": {
      const returnW = w * 0.4;
      const returnH = h * 0.45;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          <Rect
            x={hw - returnW}
            y={hh - returnH}
            width={returnW}
            height={returnH}
            fill={dark}
            cornerRadius={[0, 0, 2, 0]}
          />
        </Group>
      );
    }

    case "office-chair": {
      const seatR = Math.min(hw, hh) * 0.75;
      const backW = seatR * 1.2;
      const backH = Math.max(4, h * 0.12);
      return (
        <Group>
          <Circle x={0} y={h * 0.05} radius={seatR} fill={color} />
          <Rect x={-backW / 2} y={-hh} width={backW} height={backH} fill={dark} cornerRadius={2} />
        </Group>
      );
    }

    case "filing-cabinet": {
      const handleR = Math.min(3, w * 0.04);
      const rows = 3;
      const sectionH = h / rows;
      return (
        <Group>
          <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={2} />
          {Array.from({ length: rows }, (_, i) => {
            const lineY = -hh + sectionH * (i + 1);
            const handleY = -hh + sectionH * i + sectionH / 2;
            return (
              <Group key={i}>
                {i < rows - 1 && (
                  <Line
                    points={[-hw + 3, lineY, hw - 3, lineY]}
                    stroke={dark}
                    strokeWidth={1}
                    listening={false}
                  />
                )}
                <Circle x={0} y={handleY} radius={handleR} fill={dark} />
              </Group>
            );
          })}
        </Group>
      );
    }

    /* ───────── DEFAULT FALLBACK ───────── */

    default:
      return <Rect x={-hw} y={-hh} width={w} height={h} fill={color} cornerRadius={4} />;
  }
});
