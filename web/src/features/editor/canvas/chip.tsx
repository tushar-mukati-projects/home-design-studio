"use client";

import { Group, Rect, Text } from "react-konva";
import { EXPORT_HIDDEN_LAYER_NAME } from "@/lib/constants";
import { FLAT } from "./konva";
import { LABEL_BG, LABEL_BORDER, LABEL_FONT, LABEL_TEXT } from "./palette";

export const CHIP_FONT_PX = 11;
export const CHIP_HEIGHT_PX = 22;
export const CHIP_PADDING_PX = 16;
export const CHIP_OFFSET_PX = 16;
const CHIP_CHAR_WIDTH_PX = 6.6;
const CHIP_RADIUS_PX = 5;

type ChipProps = {
  x: number;
  y: number;
  px: number;
  text: string;
};

export const Chip = ({ x, y, px, text }: ChipProps) => {
  const w = text.length * CHIP_CHAR_WIDTH_PX + CHIP_PADDING_PX;
  return (
    <Group x={x} y={y} scaleX={px} scaleY={px} listening={false} name={EXPORT_HIDDEN_LAYER_NAME}>
      <Rect
        x={-w / 2}
        y={-CHIP_HEIGHT_PX / 2}
        width={w}
        height={CHIP_HEIGHT_PX}
        fill={LABEL_BG}
        stroke={LABEL_BORDER}
        strokeWidth={1}
        cornerRadius={CHIP_RADIUS_PX}
        {...FLAT}
      />
      <Text
        x={-w / 2}
        y={-CHIP_HEIGHT_PX / 2}
        width={w}
        height={CHIP_HEIGHT_PX}
        align="center"
        verticalAlign="middle"
        text={text}
        fontSize={CHIP_FONT_PX}
        fontStyle="600"
        fontFamily={LABEL_FONT}
        fill={LABEL_TEXT}
      />
    </Group>
  );
};
