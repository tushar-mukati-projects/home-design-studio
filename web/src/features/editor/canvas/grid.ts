// The grid is a CSS background on the canvas container, not a Konva layer: it costs nothing
// to repaint while panning, never enters an export, and follows the stage through
// background-position and background-size alone.

export interface View {
  zoom: number;
  panX: number;
  panY: number;
}

const MINOR = "rgba(120, 124, 136, 0.16)";
const MAJOR = "rgba(120, 124, 136, 0.32)";

export const applyGrid = (
  el: HTMLElement,
  view: View,
  gridMm: number,
  pxPerMm: number,
  show: boolean,
): void => {
  if (!show) {
    el.style.backgroundImage = "";
    return;
  }

  const scale = view.zoom * pxPerMm;
  const minor = gridMm * scale;
  const major = minor * 5;
  // Below ~8 px the minor lines turn to mud; show only every fifth line.
  const drawMinor = minor >= 8;

  const line = (color: string, period: number) =>
    `repeating-linear-gradient(to right, ${color} 0 1px, transparent 1px ${period}px), ` +
    `repeating-linear-gradient(to bottom, ${color} 0 1px, transparent 1px ${period}px)`;

  el.style.backgroundImage = drawMinor
    ? `${line(MAJOR, major)}, ${line(MINOR, minor)}`
    : line(MAJOR, major);
  el.style.backgroundPosition = `${view.panX}px ${view.panY}px`;
  el.style.backgroundSize = drawMinor
    ? `${major}px ${major}px, ${major}px ${major}px, ${minor}px ${minor}px, ${minor}px ${minor}px`
    : `${major}px ${major}px, ${major}px ${major}px`;
};
