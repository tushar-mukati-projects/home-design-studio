"use client";

import { memo } from "react";
import { Line, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatArea } from "@/lib/constants";
import { ROOM_USAGE_COLORS, centroid, polygonArea } from "@/lib/canvas";
import type { Room } from "@/types";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

const RoomItem = memo(function RoomItem({ room, px }: { room: Room; px: number }) {
  const [cx, cy] = centroid(room.polygon);
  const base = ROOM_USAGE_COLORS[room.usage] ?? ROOM_USAGE_COLORS.generic;

  return (
    <Group listening={false}>
      <Line
        points={room.polygon.flat()}
        closed
        fill={`${base}30`}
        stroke={`${base}60`}
        strokeWidth={1}
        strokeScaleEnabled={false}
        {...flat}
      />
      <Group x={cx} y={cy} scaleX={px} scaleY={px}>
        <Text
          x={-60}
          y={-14}
          width={120}
          align="center"
          text={room.name}
          fontSize={14}
          fontFamily="Inter, sans-serif"
          fontStyle="bold"
          fill="#1a1a2e"
          opacity={0.82}
        />
        <Text
          x={-60}
          y={4}
          width={120}
          align="center"
          text={formatArea(polygonArea(room.polygon))}
          fontSize={11}
          fontFamily="Inter, sans-serif"
          fill="#2a2a3a"
          opacity={0.65}
        />
      </Group>
    </Group>
  );
});

export const RoomShapes = memo(function RoomShapes() {
  const rooms = useEditorStore((s) => s.rooms);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);

  return (
    <>
      {rooms.map((room) => (
        <RoomItem key={room.id} room={room} px={px} />
      ))}
    </>
  );
});
