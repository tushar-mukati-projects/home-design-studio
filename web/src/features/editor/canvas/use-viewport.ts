import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM, clampZoom } from "@/lib/constants";
import type { View } from "@/lib/canvas";
import { applyGrid } from "./grid";
import type Konva from "konva";

const COMMIT_IDLE_MS = 120;
const WHEEL_STEP = 1.12;
const EASE = 0.3;
const SETTLE_ZOOM_RATIO = 0.001;
const SETTLE_PAN_PX = 0.5;
const PINCH_TOUCHES = 2;

type Animation = {
  target: View;
  frame: number;
};

type ViewportRefs = {
  containerRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<Konva.Stage | null>;
};

type PinchPanArgs = {
  containerRef: RefObject<HTMLDivElement | null>;
  viewRef: RefObject<View>;
  applyView: (view: View) => void;
  scheduleCommit: () => void;
  stopAnimation: () => void;
};

export const useViewport = ({ containerRef, stageRef }: ViewportRefs) => {
  const viewRef = useRef<View>({ zoom: 1, panX: 0, panY: 0 });
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animation | null>(null);

  const paintGrid = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    applyGrid(el, viewRef.current, useEditorStore.getState().showGrid);
  }, [containerRef]);

  const applyView = useCallback(
    (view: View) => {
      viewRef.current = view;
      const stage = stageRef.current;
      if (stage) {
        const k = view.zoom * PX_PER_MM;
        stage.scale({ x: k, y: k });
        stage.position({ x: view.panX, y: view.panY });
        stage.batchDraw();
      }
      paintGrid();
    },
    [stageRef, paintGrid],
  );

  const scheduleCommit = useCallback(() => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      useEditorStore.getState().setView(viewRef.current);
    }, COMMIT_IDLE_MS);
  }, []);

  const stopAnimation = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current.frame);
    animRef.current = null;
  }, []);

  const animateTo = useCallback(
    (target: View) => {
      if (animRef.current) {
        animRef.current.target = target;
        return;
      }
      const step = () => {
        const anim = animRef.current;
        if (!anim) return;
        const v = viewRef.current;
        const t = anim.target;
        const settled =
          Math.abs(t.zoom - v.zoom) < t.zoom * SETTLE_ZOOM_RATIO &&
          Math.abs(t.panX - v.panX) < SETTLE_PAN_PX &&
          Math.abs(t.panY - v.panY) < SETTLE_PAN_PX;
        if (settled) {
          animRef.current = null;
          applyView(t);
          scheduleCommit();
          return;
        }
        applyView({
          zoom: v.zoom + (t.zoom - v.zoom) * EASE,
          panX: v.panX + (t.panX - v.panX) * EASE,
          panY: v.panY + (t.panY - v.panY) * EASE,
        });
        anim.frame = requestAnimationFrame(step);
      };
      animRef.current = { target, frame: requestAnimationFrame(step) };
    },
    [applyView, scheduleCommit],
  );

  const zoomAround = useCallback(
    (screenX: number, screenY: number, factor: number) => {
      const v = viewRef.current;
      const zoom = clampZoom((animRef.current?.target.zoom ?? v.zoom) * factor);
      const oldK = v.zoom * PX_PER_MM;
      const newK = zoom * PX_PER_MM;
      const anchorX = (screenX - v.panX) / oldK;
      const anchorY = (screenY - v.panY) / oldK;
      animateTo({ zoom, panX: screenX - anchorX * newK, panY: screenY - anchorY * newK });
    },
    [animateTo],
  );

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const pointer = stageRef.current?.getPointerPosition();
      if (!pointer) return;
      zoomAround(pointer.x, pointer.y, e.evt.deltaY > 0 ? 1 / WHEEL_STEP : WHEEL_STEP);
    },
    [stageRef, zoomAround],
  );

  useEffect(() => {
    const sync = (animate: boolean) => {
      const s = useEditorStore.getState();
      const v = animRef.current?.target ?? viewRef.current;
      if (s.zoom !== v.zoom || s.panX !== v.panX || s.panY !== v.panY) {
        const target = { zoom: s.zoom, panX: s.panX, panY: s.panY };
        if (animate) animateTo(target);
        else applyView(target);
      } else {
        paintGrid();
      }
    };
    sync(false);
    return useEditorStore.subscribe((state, prev) => {
      if (
        state.zoom !== prev.zoom ||
        state.panX !== prev.panX ||
        state.panY !== prev.panY ||
        state.showGrid !== prev.showGrid
      ) {
        sync(true);
      }
    });
  }, [applyView, animateTo, paintGrid]);

  usePinchPan({ containerRef, viewRef, applyView, scheduleCommit, stopAnimation });

  useEffect(
    () => () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      stopAnimation();
    },
    [stopAnimation],
  );

  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);
  useLayoutEffect(() => {
    const v = viewRef.current;
    if (v.zoom !== zoom || v.panX !== panX || v.panY !== panY) applyView(v);
  }, [zoom, panX, panY, applyView]);

  return {
    viewRef,
    applyView,
    scheduleCommit,
    stopAnimation,
    handleWheel,
    committed: { zoom, panX, panY },
  };
};

const touchDistance = (t1: Touch, t2: Touch) =>
  Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

const touchCenter = (t1: Touch, t2: Touch) => ({
  x: (t1.clientX + t2.clientX) / 2,
  y: (t1.clientY + t2.clientY) / 2,
});

const usePinchPan = ({
  containerRef,
  viewRef,
  applyView,
  scheduleCommit,
  stopAnimation,
}: PinchPanArgs) => {
  const pinchingRef = useRef(false);
  const lastDistRef = useRef(0);
  const lastCenterRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== PINCH_TOUCHES) return;
      e.preventDefault();
      stopAnimation();
      pinchingRef.current = true;
      lastDistRef.current = touchDistance(e.touches[0], e.touches[1]);
      lastCenterRef.current = touchCenter(e.touches[0], e.touches[1]);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== PINCH_TOUCHES || !pinchingRef.current) return;
      e.preventDefault();
      const v = viewRef.current;
      const rect = container.getBoundingClientRect();
      const newDist = touchDistance(e.touches[0], e.touches[1]);
      const newCenter = touchCenter(e.touches[0], e.touches[1]);
      const zoom = clampZoom(v.zoom * (newDist / (lastDistRef.current || 1)));
      const oldK = v.zoom * PX_PER_MM;
      const newK = zoom * PX_PER_MM;
      const sx = newCenter.x - rect.left;
      const sy = newCenter.y - rect.top;
      const anchorX = (sx - v.panX) / oldK;
      const anchorY = (sy - v.panY) / oldK;
      applyView({
        zoom,
        panX: sx - anchorX * newK + (newCenter.x - lastCenterRef.current.x),
        panY: sy - anchorY * newK + (newCenter.y - lastCenterRef.current.y),
      });
      scheduleCommit();
      lastDistRef.current = newDist;
      lastCenterRef.current = newCenter;
    };

    const handleTouchEnd = () => {
      pinchingRef.current = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [containerRef, viewRef, applyView, scheduleCommit, stopAnimation]);
};
