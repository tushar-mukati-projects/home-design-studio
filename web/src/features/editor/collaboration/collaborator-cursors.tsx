"use client";

import { memo, useEffect, useState } from "react";
import { Group, Rect, Shape, Text } from "react-konva";
import type Konva from "konva";

import { PX_PER_MM } from "@/lib/constants";
import { useCollaborationStore, type Collaborator } from "@/stores/collaboration-store";
import { useEditorStore } from "@/stores/editor-store";
import { FLAT } from "../canvas/konva";
import { CURSOR_LABEL_TEXT, CURSOR_OUTLINE, LABEL_FONT } from "../canvas/palette";

const CURSOR_FADE_MS = 5_000;
const FADE_TICK_MS = 1_000;
const FADED_OPACITY = 0.25;
const CURSOR_NAME_MAX_CHARS = 24;
const CURSOR_OUTLINE_WIDTH_PX = 1.2;
const CURSOR_POINTER_PX: [number, number][] = [
  [0, 0],
  [0, 18],
  [5.4, 13.8],
  [9.6, 21.6],
  [12, 20.4],
  [7.8, 12.6],
  [13.2, 12.6],
];
const LABEL_X_PX = 13;
const LABEL_Y_PX = 17;
const LABEL_HEIGHT_PX = 20;
const LABEL_RADIUS_PX = 4;
const LABEL_CHAR_WIDTH_PX = 7;
const LABEL_PADDING_PX = 18;
const LABEL_FONT_SIZE_PX = 11;

type CollaboratorCursorProps = {
  collaborator: Collaborator;
  scale: number;
  faded: boolean;
};

const Cursors = () => {
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const zoom = useEditorStore((s) => s.zoom);
  const now = useClock(collaborators.length > 0);
  const scale = 1 / (zoom * PX_PER_MM);

  return (
    <>
      {collaborators.map((collaborator) => (
        <CollaboratorCursor
          key={collaborator.id}
          collaborator={collaborator}
          scale={scale}
          faded={now - collaborator.lastSeen > CURSOR_FADE_MS}
        />
      ))}
    </>
  );
};

export const CollaboratorCursors = memo(Cursors);

const CollaboratorCursor = ({ collaborator, scale, faded }: CollaboratorCursorProps) => {
  const label = collaborator.name.slice(0, CURSOR_NAME_MAX_CHARS);
  const labelWidth = label.length * LABEL_CHAR_WIDTH_PX + LABEL_PADDING_PX;

  return (
    <Group
      x={collaborator.x}
      y={collaborator.y}
      opacity={faded ? FADED_OPACITY : 1}
      scaleX={scale}
      scaleY={scale}
      listening={false}
    >
      <Shape
        sceneFunc={drawPointer}
        fill={collaborator.color}
        stroke={CURSOR_OUTLINE}
        strokeWidth={CURSOR_OUTLINE_WIDTH_PX}
        {...FLAT}
      />
      <Rect
        x={LABEL_X_PX}
        y={LABEL_Y_PX}
        width={labelWidth}
        height={LABEL_HEIGHT_PX}
        fill={collaborator.color}
        cornerRadius={LABEL_RADIUS_PX}
        {...FLAT}
      />
      <Text
        x={LABEL_X_PX}
        y={LABEL_Y_PX}
        width={labelWidth}
        height={LABEL_HEIGHT_PX}
        text={label}
        fontSize={LABEL_FONT_SIZE_PX}
        fontStyle="600"
        fontFamily={LABEL_FONT}
        fill={CURSOR_LABEL_TEXT}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

const drawPointer = (ctx: Konva.Context, shape: Konva.Shape) => {
  const [[startX, startY], ...corners] = CURSOR_POINTER_PX;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (const [x, y] of corners) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStrokeShape(shape);
};

const useClock = (running: boolean): number => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), FADE_TICK_MS);
    return () => clearInterval(id);
  }, [running]);
  return now;
};
