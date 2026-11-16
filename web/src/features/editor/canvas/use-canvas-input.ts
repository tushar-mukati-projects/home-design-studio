import { useCallback, useEffect, useRef, type RefObject } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { PICK_THRESHOLD_PX, PX_PER_MM } from "@/lib/constants";
import type { View } from "@/lib/canvas";
import { isTypingTarget, spaceStartsPan } from "../keyboard-shortcuts";
import { drawWall, eraseAt, placeOpening, selectOpeningAt } from "./tool-clicks";
import type { PointerState } from "./wall-preview";
import type { EditorTool } from "@/types";
import type Konva from "konva";

const PRIMARY_BUTTON = 0;
const MIDDLE_BUTTON = 1;

const TOOL_CURSORS = {
  select: "default",
  wall: "crosshair",
  door: "crosshair",
  window: "crosshair",
  eraser: "not-allowed",
  pan: "grab",
} satisfies Record<EditorTool, string>;

type CanvasInputArgs = {
  stageRef: RefObject<Konva.Stage | null>;
  viewRef: RefObject<View>;
  applyView: (view: View) => void;
  scheduleCommit: () => void;
  stopAnimation: () => void;
  onCursorMove?: (x: number, y: number) => void;
};

type MouseEvent = Konva.KonvaEventObject<globalThis.MouseEvent>;

export const useCanvasInput = ({
  stageRef,
  viewRef,
  applyView,
  scheduleCommit,
  stopAnimation,
  onCursorMove,
}: CanvasInputArgs) => {
  const pointerRef = useRef<PointerState | null>(null);
  const overlayRef = useRef<Konva.Layer | null>(null);
  const openingPriorityRef = useRef(false);
  const isPanningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const lastPanPosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);
  const activeTool = useEditorStore((s) => s.activeTool);

  const setCursor = useCallback(
    (cursor: string) => stageRef.current?.container().style.setProperty("cursor", cursor),
    [stageRef],
  );

  const restCursor = useCallback(() => {
    setCursor(spaceHeldRef.current ? "grab" : TOOL_CURSORS[useEditorStore.getState().activeTool]);
  }, [setCursor]);

  const redrawPreview = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => overlayRef.current?.batchDraw());
  }, []);

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      const s = useEditorStore.getState();
      const { button } = e.evt;
      const pans = s.activeTool === "pan" || spaceHeldRef.current;
      if (button === MIDDLE_BUTTON || (button === PRIMARY_BUTTON && pans)) {
        stopAnimation();
        isPanningRef.current = true;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        setCursor("grabbing");
        return;
      }
      if (button !== PRIMARY_BUTTON || (!s.canEdit && s.activeTool !== "select")) return;
      const point = stage.getRelativePointerPosition();
      if (!point) return;
      const threshold = PICK_THRESHOLD_PX / (viewRef.current.zoom * PX_PER_MM);
      if (s.activeTool === "wall") return drawWall(s, point, e.evt.shiftKey);
      if (s.activeTool === "door" || s.activeTool === "window") {
        openingPriorityRef.current = placeOpening(s, s.activeTool, point, threshold);
        return;
      }
      if (s.activeTool === "eraser") return eraseAt(s, point, threshold);
      if (s.activeTool !== "select") return;
      openingPriorityRef.current = selectOpeningAt(s, point, threshold);
      const onEmpty = e.target === stage || e.target.getParent() === stage;
      if (!openingPriorityRef.current && onEmpty) s.clearSelection();
    },
    [stageRef, viewRef, setCursor, stopAnimation],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const stage = stageRef.current;
      if (!stage) return;
      if (isPanningRef.current) {
        const dx = e.evt.clientX - lastPanPosRef.current.x;
        const dy = e.evt.clientY - lastPanPosRef.current.y;
        lastPanPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
        const v = viewRef.current;
        applyView({ ...v, panX: v.panX + dx, panY: v.panY + dy });
        scheduleCommit();
        return;
      }
      const point = stage.getRelativePointerPosition();
      if (!point) return;
      pointerRef.current = { ...point, shift: e.evt.shiftKey };
      onCursorMove?.(point.x, point.y);
      const s = useEditorStore.getState();
      if (s.activeTool === "wall" && s.isDrawing) redrawPreview();
    },
    [stageRef, viewRef, onCursorMove, applyView, scheduleCommit, redrawPreview],
  );

  const handleMouseUp = useCallback(() => {
    if (!isPanningRef.current) return;
    isPanningRef.current = false;
    restCursor();
  }, [restCursor]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  useEffect(() => {
    setCursor(TOOL_CURSORS[activeTool]);
  }, [activeTool, setCursor]);

  useEffect(() => {
    const setShift = (shift: boolean) => {
      if (!pointerRef.current) return;
      pointerRef.current = { ...pointerRef.current, shift };
      redrawPreview();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (isTypingTarget(target) || useEditorStore.getState().openModals > 0) return;
      if (e.key === "Shift") return setShift(true);
      if (e.code !== "Space" || !spaceStartsPan(target)) return;
      e.preventDefault();
      if (e.repeat) return;
      spaceHeldRef.current = true;
      if (!isPanningRef.current) setCursor("grab");
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") return setShift(false);
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      if (!isPanningRef.current) restCursor();
    };
    const handleBlur = () => {
      spaceHeldRef.current = false;
      if (!isPanningRef.current) restCursor();
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [setCursor, restCursor, redrawPreview]);

  return {
    pointerRef,
    overlayRef,
    openingPriorityRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
};
