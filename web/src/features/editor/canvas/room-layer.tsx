"use client";

import { memo } from "react";
import { Layer, Line, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";

const ROOM_COLORS: Record<string, string> = {
  "living-room": "#2c2c2e30",
  living_room: "#2c2c2e30",
  bedroom: "#6B5B9530",
  kitchen: "#C4564530",
  bathroom: "#4A7FB530",
  office: "#2EA85A30",
  dining: "#D4862030",
  dining_room: "#D4862030",
  hallway: "#71717a28",
  closet: "#a1a1aa28",
  garage: "#78788028",
  generic: "#8a8a9428",
};

const getCentroid = (points: { x: number; y: number }[]) => {
  if (points.length === 0) return { x: 0, y: 0 };
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / points.length, y: cy / points.length };
};

const toFill = (color: string) => (/^#[0-9a-f]{6}$/i.test(color) ? color + "30" : color);
const toStroke = (color: string) =>
  /^#[0-9a-f]{6,8}$/i.test(color) ? color.slice(0, 7) + "60" : color;

export const RoomLayer = memo(() => {
  const rooms = useEditorStore((s) => s.rooms);
  const zoom = useEditorStore((s) => s.zoom);

  return (
    <Layer listening={false}>
      {rooms.map((room) => {
        const flatPoints = room.points.flatMap((p) => [p.x, p.y]);
        const center = getCentroid(room.points);
        const fillColor = room.color
          ? toFill(room.color)
          : ROOM_COLORS[room.type] || ROOM_COLORS.generic;
        const strokeColor = toStroke(fillColor);

        return (
          <Group key={room.id}>
            <Line
              points={flatPoints}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={1 / zoom}
            />
            <Text
              x={center.x - 60}
              y={center.y - 14}
              width={120}
              align="center"
              text={room.name}
              fontSize={14 / zoom}
              fontFamily="Inter, sans-serif"
              fontStyle="bold"
              fill="#1a1a2e"
              opacity={0.82}
              listening={false}
            />
            <Text
              x={center.x - 60}
              y={center.y + 4}
              width={120}
              align="center"
              text={`${(room.area / 900).toFixed(1)} sq ft`}
              fontSize={11 / zoom}
              fontFamily="Inter, sans-serif"
              fill="#2a2a3a"
              opacity={0.65}
              listening={false}
            />
          </Group>
        );
      })}
    </Layer>
  );
});
RoomLayer.displayName = "RoomLayer";
