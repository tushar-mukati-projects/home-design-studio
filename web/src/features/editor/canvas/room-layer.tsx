"use client";

import { memo } from "react";
import { Layer, Line, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";

const ROOM_COLORS: Record<string, string> = {
  "living-room": "#D4A85320",
  bedroom: "#7B68EE20",
  kitchen: "#FF634720",
  bathroom: "#4682B420",
  office: "#32CD3220",
  dining: "#FF8C0020",
  generic: "#8A827820",
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
              fontFamily="Figtree, sans-serif"
              fontStyle="bold"
              fill="#F5F0EB"
              opacity={0.6}
              listening={false}
            />
            <Text
              x={center.x - 50}
              y={center.y + 4}
              width={100}
              align="center"
              text={`${room.area.toFixed(1)} sq ft`}
              fontSize={11 / zoom}
              fontFamily="Figtree, sans-serif"
              fill="#8A8278"
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
