"use client";

import { memo } from "react";
import { Layer, Line, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";

const ROOM_COLORS: Record<string, string> = {
  "living-room": "#2c2c2e20",
  living_room: "#2c2c2e20",
  bedroom: "#6B5B9520",
  kitchen: "#C4564520",
  bathroom: "#4A7FB520",
  office: "#2EA85A20",
  dining: "#D4862020",
  dining_room: "#D4862020",
  hallway: "#71717a20",
  closet: "#a1a1aa20",
  garage: "#78788020",
  generic: "#8a8a9420",
};

const getCentroid = (points: { x: number; y: number }[]) => {
  let cx = 0;
  let cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  return { x: cx / points.length, y: cy / points.length };
};

export const RoomLayer = memo(() => {
  const rooms = useEditorStore((s) => s.rooms);
  const zoom = useEditorStore((s) => s.zoom);

  return (
    <Layer listening={false}>
      {rooms.map((room) => {
        const flatPoints = room.points.flatMap((p) => [p.x, p.y]);
        const center = getCentroid(room.points);
        const fillColor = ROOM_COLORS[room.type] || ROOM_COLORS.generic;
        const strokeColor = fillColor.slice(0, 7) + "60";

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
              x={center.x - 50}
              y={center.y - 14}
              width={100}
              align="center"
              text={room.name}
              fontSize={14 / zoom}
              fontFamily="Inter, sans-serif"
              fontStyle="bold"
              fill="#3a3a4a"
              opacity={0.6}
              listening={false}
            />
            <Text
              x={center.x - 50}
              y={center.y + 4}
              width={100}
              align="center"
              text={`${(room.area / 900).toFixed(1)} sq ft`}
              fontSize={11 / zoom}
              fontFamily="Inter, sans-serif"
              fill="#6b6b78"
              opacity={0.6}
              listening={false}
            />
          </Group>
        );
      })}
    </Layer>
  );
});
RoomLayer.displayName = "RoomLayer";
