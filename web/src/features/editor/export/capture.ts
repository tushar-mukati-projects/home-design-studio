import type { RefObject } from "react";
import type Konva from "konva";
import { boundsOf } from "@/lib/canvas";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";

export const EXPORT_PIXEL_RATIO = 2;
export const EXPORT_PIXEL_RATIO_HIGH = 3;
export const PREVIEW_PIXEL_RATIO = 0.5;

const EXPORT_PX_PER_MM = PX_PER_MM;
const EXPORT_PAD_PX = 40;
const MAX_CANVAS_SIDE_PX = 16_384;
const FALLBACK_FILE_NAME = "untitled";
const FORBIDDEN_FILE_CHARS = /[<>:"/\\|?*\p{Cc}]/gu;

const EMPTY_PLAN_MESSAGE = "Nothing to export yet. Draw a wall first.";
const STAGE_NOT_READY_MESSAGE = "The plan isn't ready to export yet. Try again in a moment.";

export type StageRef = RefObject<Konva.Stage | null>;

export type Capture = {
  dataUrl: string;
  width: number;
  height: number;
};

export const readyStage = (stageRef: StageRef): Konva.Stage => {
  if (!stageRef.current) throw new Error(STAGE_NOT_READY_MESSAGE);
  return stageRef.current;
};

export const captureStage = (stage: Konva.Stage, density: number): Capture => {
  if (!boundsOf(useEditorStore.getState())) throw new Error(EMPTY_PLAN_MESSAGE);
  const hidden = stage.find("." + EXPORT_HIDDEN_LAYER_NAME).filter((node) => node.visible());
  try {
    hidden.forEach((node) => node.visible(false));
    const rect = stage.getClientRect();
    const region = {
      x: rect.x - EXPORT_PAD_PX,
      y: rect.y - EXPORT_PAD_PX,
      width: rect.width + EXPORT_PAD_PX * 2,
      height: rect.height + EXPORT_PAD_PX * 2,
    };
    const pixelRatio = Math.min(
      (EXPORT_PX_PER_MM * density) / stage.scaleX(),
      MAX_CANVAS_SIDE_PX / Math.max(region.width, region.height),
    );
    return {
      dataUrl: stage.toDataURL({ pixelRatio, ...region }),
      width: region.width,
      height: region.height,
    };
  } finally {
    hidden.forEach((node) => node.visible(true));
    stage.batchDraw();
  }
};

export const exportFileName = (designName: string): string =>
  designName.replace(FORBIDDEN_FILE_CHARS, "").trim() || FALLBACK_FILE_NAME;
