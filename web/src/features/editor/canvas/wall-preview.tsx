"use client";

import { Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, formatLength } from "@/lib/constants";
import { labelNormal, toDegrees } from "@/lib/canvas";
import { DEFAULTS } from "@/shared/canvas";
import { CHIP_FONT_PX, CHIP_HEIGHT_PX, CHIP_OFFSET_PX, CHIP_PADDING_PX } from "./chip";
import { LABEL_BG, LABEL_FONT, LABEL_TEXT, SELECTION, WALL_PREVIEW_FILL } from "./palette";
import type { Point } from "@/types";
import type { RefObject } from "react";
import type Konva from "konva";

const GUIDE_STROKE_PX = 1.2;
const GUIDE_DASH_PX = [6, 4];
const END_RADIUS_PX = 4;
const JOINED_RADIUS_PX = 8;
const JOINED_STROKE_PX = 2;
const MIN_LABEL_LENGTH_MM = 1;

export type PointerState = {
  x: number;
  y: number;
  shift: boolean;
};

type WallPreviewProps = {
  pointerRef: RefObject<PointerState | null>;
};

export const WallPreview = ({ pointerRef }: WallPreviewProps) => {
  const active = useEditorStore(
    (s) => s.activeTool === "wall" && s.isDrawing && s.currentWallStart !== null,
  );
  if (!active) return null;

  return <Shape listening={false} sceneFunc={(ctx) => drawPreview(ctx, pointerRef.current)} />;
};

const drawPreview = (ctx: Konva.Context, pointer: PointerState | null) => {
  const s = useEditorStore.getState();
  const start = s.currentWallStart;
  if (!pointer || !start) return;
  const px = 1 / (s.zoom * PX_PER_MM);
  const { point: end, joined } = s.snapWallPoint(pointer, { shift: pointer.shift });
  drawGuide(ctx, start, end, joined !== null, px);
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length < MIN_LABEL_LENGTH_MM) return;
  drawLabel(ctx, start, end, length, pointer.shift, px);
};

const drawGuide = (ctx: Konva.Context, start: Point, end: Point, joined: boolean, px: number) => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.lineCap = "butt";
  ctx.lineWidth = DEFAULTS.wallThickness;
  ctx.strokeStyle = WALL_PREVIEW_FILL;
  ctx.stroke();
  ctx.lineWidth = GUIDE_STROKE_PX * px;
  ctx.strokeStyle = SELECTION;
  ctx.setLineDash(GUIDE_DASH_PX.map((v) => v * px));
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.arc(start.x, start.y, END_RADIUS_PX * px, 0, Math.PI * 2);
  ctx.fillStyle = SELECTION;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(end.x, end.y, (joined ? JOINED_RADIUS_PX : END_RADIUS_PX) * px, 0, Math.PI * 2);
  if (joined) {
    ctx.lineWidth = JOINED_STROKE_PX * px;
    ctx.strokeStyle = SELECTION;
    ctx.stroke();
  } else {
    ctx.fill();
  }
};

const drawLabel = (
  ctx: Konva.Context,
  start: Point,
  end: Point,
  length: number,
  withAngle: boolean,
  px: number,
) => {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const degrees = Math.round(((toDegrees(-angle) % 360) + 360) % 360);
  const text = withAngle ? `${formatLength(length)}  ${degrees}°` : formatLength(length);
  const normal = labelNormal(angle);
  const offset = DEFAULTS.wallThickness / 2 + CHIP_OFFSET_PX * px;
  const cx = (start.x + end.x) / 2 + Math.cos(normal) * offset;
  const cy = (start.y + end.y) / 2 + Math.sin(normal) * offset;
  ctx.font = `600 ${CHIP_FONT_PX * px}px ${LABEL_FONT}`;
  const w = ctx.measureText(text).width + CHIP_PADDING_PX * px;
  ctx.fillStyle = LABEL_BG;
  ctx.fillRect(cx - w / 2, cy - (CHIP_HEIGHT_PX / 2) * px, w, CHIP_HEIGHT_PX * px);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = LABEL_TEXT;
  ctx.fillText(text, cx, cy);
};
