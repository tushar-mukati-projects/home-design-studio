"use client";

import { memo } from "react";
import { Line, Rect, Text, Group } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatArea } from "@/lib/constants";
import { ROOM_USAGE_COLORS, centroid, polygonArea } from "@/lib/canvas";
import { ACCENT, LABEL_FONT } from "./wall-layer";
import { useHover } from "./hover";
import type { Room } from "@/types";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

const RoomItem = memo(function RoomItem({ room, isSelected }: { room: Room; isSelected: boolean }) {
  const { hovered, ...hover } = useHover();
  const base = ROOM_USAGE_COLORS[room.usage] ?? ROOM_USAGE_COLORS.generic;

  const select = () => {
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(room.id);
  };

  return (
    <Line
      points={room.polygon.flat()}
      closed
      fill={`${base}${isSelected ? "42" : hovered ? "38" : "2a"}`}
      stroke={isSelected ? ACCENT : `${base}66`}
      strokeWidth={isSelected ? 2 : 1}
      strokeScaleEnabled={false}
      onClick={select}
      onTap={select}
      {...hover}
      {...flat}
    />
  );
});

export const RoomShapes = memo(function RoomShapes() {
  const rooms = useEditorStore((s) => s.rooms);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  return (
    <>
      {rooms.map((room) => (
        <RoomItem key={room.id} room={room} isSelected={selectedElementId === room.id} />
      ))}
    </>
  );
});

const RoomLabel = memo(function RoomLabel({ room, px }: { room: Room; px: number }) {
  const [cx, cy] = centroid(room.polygon);
  const area = formatArea(polygonArea(room.polygon));
  const w = Math.max(room.name.length * 7.4, area.length * 6.2) + 22;

  return (
    <Group x={cx} y={cy} scaleX={px} scaleY={px} listening={false}>
      <Rect
        x={-w / 2}
        y={-17}
        width={w}
        height={34}
        fill="rgba(255, 255, 255, 0.84)"
        cornerRadius={7}
        {...flat}
      />
      <Text
        x={-w / 2}
        y={-14}
        width={w}
        align="center"
        text={room.name}
        fontSize={12.5}
        fontStyle="600"
        fontFamily={LABEL_FONT}
        fill="#2a2a34"
      />
      <Text
        x={-w / 2}
        y={2}
        width={w}
        align="center"
        text={area}
        fontSize={10.5}
        fontFamily={LABEL_FONT}
        fill="#6b6b78"
      />
    </Group>
  );
});

export const RoomLabels = memo(function RoomLabels() {
  const rooms = useEditorStore((s) => s.rooms);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);
  return (
    <>
      {rooms.map((room) => (
        <RoomLabel key={room.id} room={room} px={px} />
      ))}
    </>
  );
});
