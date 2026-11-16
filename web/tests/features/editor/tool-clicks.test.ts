import { describe, test, expect, beforeEach } from "bun:test";

import { placeOpening } from "@/features/editor/canvas/tool-clicks";
import { useEditorStore } from "@/stores/editor-store";
import { newWall } from "@/shared/canvas";

const store = () => useEditorStore.getState();
const PICK_THRESHOLD_MM = 200;

beforeEach(() => {
  useEditorStore.setState({ walls: [], openings: [], selectedElementId: null, activeTool: "door" });
});

describe("placeOpening", () => {
  test("a door placed on a wall is selected and claims the click", () => {
    store().addWall(newWall([0, 0], [4000, 0]));
    const placed = placeOpening(store(), "door", { x: 2000, y: 20 }, PICK_THRESHOLD_MM);
    expect(placed).toBe(true);
    expect(store().openings).toHaveLength(1);
    expect(store().selectedElementId).toBe(store().openings[0].id);
    expect(store().activeTool).toBe("select");
  });

  test("a click away from every wall places nothing and leaves the click to others", () => {
    store().addWall(newWall([0, 0], [4000, 0]));
    const placed = placeOpening(store(), "window", { x: 2000, y: 3000 }, PICK_THRESHOLD_MM);
    expect(placed).toBe(false);
    expect(store().openings).toHaveLength(0);
  });
});
