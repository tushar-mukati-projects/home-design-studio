import { useEditorStore } from "@/stores/editor-store";
import { MIN_WALL_LENGTH_MM } from "@/lib/constants";
import {
  clampOpeningOffset,
  furnitureAt,
  nearestOpening,
  nearestWall,
  offsetAlongWall,
  toVec,
} from "@/lib/canvas";
import { DEFAULTS, newOpening, newWall, type Opening } from "@/shared/canvas";
import type { Point } from "@/types";

type Editor = ReturnType<typeof useEditorStore.getState>;

export const drawWall = (s: Editor, point: Point, shift: boolean): void => {
  const { point: snapped } = s.snapWallPoint(point, { shift });
  if (!s.isDrawing) {
    s.setIsDrawing(true);
    s.setCurrentWallStart(snapped);
    return;
  }
  if (!s.currentWallStart) return;
  const length = Math.hypot(snapped.x - s.currentWallStart.x, snapped.y - s.currentWallStart.y);
  if (length > MIN_WALL_LENGTH_MM) {
    s.addWall(newWall(toVec(s.currentWallStart), toVec(snapped)));
  }
  s.setCurrentWallStart(snapped);
};

export const placeOpening = (
  s: Editor,
  kind: Opening["kind"],
  point: Point,
  threshold: number,
): boolean => {
  const wall = nearestWall(point.x, point.y, s.walls, threshold);
  if (!wall) return false;
  const offset = clampOpeningOffset(DEFAULTS[kind], wall, offsetAlongWall(wall, point.x, point.y));
  const opening = newOpening(kind, wall.id, offset);
  s.addOpening(opening);
  s.setTool("select");
  s.setSelectedElement(opening.id);
  return true;
};

export const eraseAt = (s: Editor, point: Point, threshold: number): void => {
  const opening = nearestOpening(point.x, point.y, s.openings, s.walls, threshold);
  if (opening) {
    s.removeOpening(opening.id);
    return;
  }
  const wall = nearestWall(point.x, point.y, s.walls, threshold / 2);
  if (wall) {
    s.removeWall(wall.id);
    return;
  }
  const piece = furnitureAt(point.x, point.y, s.furniture, s.catalog);
  if (piece) s.removeFurniture(piece.id);
};

export const selectOpeningAt = (s: Editor, point: Point, threshold: number): boolean => {
  const opening = nearestOpening(point.x, point.y, s.openings, s.walls, threshold);
  if (opening) s.setSelectedElement(opening.id);
  return opening !== null;
};
