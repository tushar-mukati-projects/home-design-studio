"use client";

import { memo } from "react";
import { Group, Line, Rect, Text } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatArea } from "@/lib/constants";
import { ROOM_USAGE_COLORS, centroid } from "@/lib/canvas";
import { polygonArea, type Room } from "@/shared/canvas";
import { useHover } from "./hover";
import { FLAT } from "./konva";
import { LABEL_FONT, LABEL_MUTED_TEXT, LABEL_TEXT, ROOM_LABEL_BG, SELECTION } from "./palette";

const FILL_ALPHA_SELECTED = "42";
const FILL_ALPHA_HOVERED = "38";
const FILL_ALPHA = "2a";
const STROKE_ALPHA = "66";
const SELECTED_STROKE_PX = 2;

const NAME_FONT_PX = 12.5;
const AREA_FONT_PX = 10.5;
const NAME_CHAR_WIDTH_PX = 7.4;
const AREA_CHAR_WIDTH_PX = 6.2;
const LABEL_PADDING_PX = 22;
const LABEL_HEIGHT_PX = 34;
const LABEL_RADIUS_PX = 7;
const NAME_TOP_PX = -14;
const AREA_TOP_PX = 2;

type RoomItemProps = {
  room: Room;
  isSelected: boolean;
};

type RoomLabelProps = {
  room: Room;
  px: number;
};

const Rooms = () => {
  const rooms = useEditorStore((s) => s.rooms);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  return (
    <>
      {rooms.map((room) => (
        <RoomItem key={room.id} room={room} isSelected={selectedElementId === room.id} />
      ))}
    </>
  );
};

const Labels = () => {
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
};

const RoomFill = ({ room, isSelected }: RoomItemProps) => {
  const { hovered, ...hover } = useHover();
  const base = ROOM_USAGE_COLORS[room.usage];
  const alpha = isSelected ? FILL_ALPHA_SELECTED : hovered ? FILL_ALPHA_HOVERED : FILL_ALPHA;

  const select = () => {
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(room.id);
  };

  return (
    <Line
      points={room.polygon.flat()}
      closed
      fill={`${base}${alpha}`}
      stroke={isSelected ? SELECTION : `${base}${STROKE_ALPHA}`}
      strokeWidth={isSelected ? SELECTED_STROKE_PX : 1}
      strokeScaleEnabled={false}
      onClick={select}
      onTap={select}
      {...hover}
      {...FLAT}
    />
  );
};

const RoomTag = ({ room, px }: RoomLabelProps) => {
  const [cx, cy] = centroid(room.polygon);
  const area = formatArea(polygonArea(room.polygon));
  const w =
    Math.max(room.name.length * NAME_CHAR_WIDTH_PX, area.length * AREA_CHAR_WIDTH_PX) +
    LABEL_PADDING_PX;

  return (
    <Group x={cx} y={cy} scaleX={px} scaleY={px} listening={false}>
      <Rect
        x={-w / 2}
        y={-LABEL_HEIGHT_PX / 2}
        width={w}
        height={LABEL_HEIGHT_PX}
        fill={ROOM_LABEL_BG}
        cornerRadius={LABEL_RADIUS_PX}
        {...FLAT}
      />
      <Text
        x={-w / 2}
        y={NAME_TOP_PX}
        width={w}
        align="center"
        text={room.name}
        fontSize={NAME_FONT_PX}
        fontStyle="600"
        fontFamily={LABEL_FONT}
        fill={LABEL_TEXT}
      />
      <Text
        x={-w / 2}
        y={AREA_TOP_PX}
        width={w}
        align="center"
        text={area}
        fontSize={AREA_FONT_PX}
        fontFamily={LABEL_FONT}
        fill={LABEL_MUTED_TEXT}
      />
    </Group>
  );
};

const RoomItem = memo(RoomFill);
const RoomLabel = memo(RoomTag);

export const RoomShapes = memo(Rooms);
export const RoomLabels = memo(Labels);
