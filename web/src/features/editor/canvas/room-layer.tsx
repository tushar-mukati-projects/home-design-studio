"use client";

import { memo } from "react";
import { Layer, Line, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatArea } from "@/lib/constants";
import { ROOM_USAGE_COLORS, centroid, polygonArea } from "@/lib/canvas";

export const RoomLayer = memo(() => {
  const rooms = useEditorStore((s) => s.rooms);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);

  return (
    <Layer listening={false}>
      {rooms.map((room) => {
        const [cx, cy] = centroid(room.polygon);
        const base = ROOM_USAGE_COLORS[room.usage] ?? ROOM_USAGE_COLORS.generic;

        return (
          <Group key={room.id}>
            <Line
              points={room.polygon.flat()}
              closed
              fill={`${base}30`}
              stroke={`${base}60`}
              strokeWidth={px}
            />
            <Text
              x={cx - 600}
              y={cy - 14 * px}
              width={1200}
              align="center"
              text={room.name}
              fontSize={14 * px}
              fontFamily="Inter, sans-serif"
              fontStyle="bold"
              fill="#1a1a2e"
              opacity={0.82}
              listening={false}
            />
            <Text
              x={cx - 600}
              y={cy + 4 * px}
              width={1200}
              align="center"
              text={formatArea(polygonArea(room.polygon))}
              fontSize={11 * px}
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
