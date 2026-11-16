import type { View } from "@/lib/canvas";
import { GRID_MM, PX_PER_MM } from "@/lib/constants";
import { GRID_MAJOR, GRID_MINOR } from "./palette";

const MAJOR_EVERY = 5;
const MIN_MINOR_SPACING_PX = 8;

export const applyGrid = (el: HTMLElement, view: View, show: boolean): void => {
  if (!show) {
    el.style.backgroundImage = "";
    return;
  }

  const minor = GRID_MM * view.zoom * PX_PER_MM;
  const major = minor * MAJOR_EVERY;
  const drawMinor = minor >= MIN_MINOR_SPACING_PX;

  const line = (color: string, period: number) =>
    `repeating-linear-gradient(to right, ${color} 0 1px, transparent 1px ${period}px), ` +
    `repeating-linear-gradient(to bottom, ${color} 0 1px, transparent 1px ${period}px)`;

  el.style.backgroundImage = drawMinor
    ? `${line(GRID_MAJOR, major)}, ${line(GRID_MINOR, minor)}`
    : line(GRID_MAJOR, major);
  el.style.backgroundPosition = `${view.panX}px ${view.panY}px`;
  el.style.backgroundSize = drawMinor
    ? `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`
    : `${major}px ${major}px, ${major}px ${major}px`;
};
