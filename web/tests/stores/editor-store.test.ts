import { describe, test, expect, beforeEach } from "bun:test";
import { useEditorStore } from "@/stores/editor-store";
import { GRID_MM } from "@/lib/constants";
import type { Furniture, Opening, Room, Wall } from "@/types";

const store = () => useEditorStore.getState();

const wall = (id: string, overrides: Partial<Wall> = {}): Wall => ({
  id,
  from: [0, 0],
  to: [4000, 0],
  thickness: 120,
  height: 2700,
  ...overrides,
});

const door = (id: string, wallId = "w1"): Opening => ({
  id,
  kind: "door",
  wall: wallId,
  offset: 2000,
  width: 900,
  height: 2100,
});

const windowEl = (id: string, wallId = "w1"): Opening => ({
  id,
  kind: "window",
  wall: wallId,
  offset: 1000,
  width: 1200,
  height: 1200,
  sill: 900,
});

const room = (id: string, overrides: Partial<Room> = {}): Room => ({
  id,
  name: "Room",
  usage: "generic",
  polygon: [
    [0, 0],
    [1000, 0],
    [1000, 1000],
  ],
  ...overrides,
});

const furniture = (id: string): Furniture => ({ id, item: "sofa", at: [0, 0], rotation: 0 });

beforeEach(() => {
  useEditorStore.setState({
    walls: [],
    openings: [],
    rooms: [],
    furniture: [],
    past: [],
    future: [],
    batchDepth: 0,
    pendingBatchSnapshot: null,
    lastCoalesceKey: null,
    lastCoalesceAt: 0,
    selectedElementId: null,
    activeTool: "select",
    zoom: 1,
    panX: 0,
    panY: 0,
    gridSize: GRID_MM,
    showGrid: true,
    snapToGrid: true,
  });
});

describe("history coalescing", () => {
  test("a slider drag collapses into one undo step", () => {
    store().addWall(wall("w1"));
    const before = store().past.length;
    for (let thickness = 100; thickness <= 300; thickness += 10) {
      store().updateWall("w1", { thickness }, "wall-thickness:w1");
    }
    expect(store().past.length - before).toBe(1);
    expect(store().walls[0].thickness).toBe(300);
  });

  test("one undo reverts the whole drag, redo reapplies it", () => {
    store().addWall(wall("w1"));
    for (let thickness = 100; thickness <= 300; thickness += 10) {
      store().updateWall("w1", { thickness }, "wall-thickness:w1");
    }
    store().undo();
    expect(store().walls[0].thickness).toBe(120);
    store().redo();
    expect(store().walls[0].thickness).toBe(300);
  });

  test("different coalesce keys stay separate", () => {
    store().addWall(wall("a"));
    store().addWall(wall("b"));
    const before = store().past.length;
    store().updateWall("a", { thickness: 100 }, "wall-thickness:a");
    store().updateWall("b", { thickness: 100 }, "wall-thickness:b");
    expect(store().past.length - before).toBe(2);
  });

  test("edits without a key each get their own entry", () => {
    store().addWall(wall("w1"));
    const before = store().past.length;
    store().updateWall("w1", { color: "#111111" });
    store().updateWall("w1", { color: "#222222" });
    expect(store().past.length - before).toBe(2);
  });

  test("undo reopens the coalesce window", () => {
    store().addWall(wall("w1"));
    store().updateWall("w1", { thickness: 200 }, "k");
    store().undo();
    const before = store().past.length;
    store().updateWall("w1", { thickness: 250 }, "k");
    expect(store().past.length - before).toBe(1);
  });

  test("coalescing works for openings and furniture too", () => {
    store().addOpening(door("d1"));
    store().addFurniture(furniture("f1"));
    for (const drag of [
      () => store().updateOpening("d1", { width: 800 }, "opening-width:d1"),
      () => store().updateFurniture("f1", { rotation: 5 }, "furniture-rotation:f1"),
    ]) {
      const before = store().past.length;
      for (let i = 0; i < 10; i++) drag();
      expect(store().past.length - before).toBe(1);
    }
  });

  test("only the most recent key coalesces, so interleaved drags do not merge", () => {
    store().addOpening(door("d1"));
    store().addOpening(windowEl("n1"));
    const before = store().past.length;
    store().updateOpening("d1", { width: 800 }, "opening-width:d1");
    store().updateOpening("n1", { width: 1000 }, "opening-width:n1");
    store().updateOpening("d1", { width: 810 }, "opening-width:d1");
    expect(store().past.length - before).toBe(3);
  });
});

describe("batching", () => {
  test("many mutations collapse into one undo step", () => {
    store().beginBatch();
    store().addWall(wall("x1"));
    store().addWall(wall("x2"));
    store().setRooms([room("r1")], { recordHistory: true });
    store().endBatch();

    expect(store().past.length).toBe(1);
    store().undo();
    expect(store().walls).toHaveLength(0);
    expect(store().rooms).toHaveLength(0);
  });

  test("a batch that changes nothing leaves no undo entry", () => {
    store().beginBatch();
    store().endBatch();
    expect(store().past).toHaveLength(0);
    expect(store().pendingBatchSnapshot).toBeNull();
  });

  test("nested batches still produce one entry", () => {
    store().beginBatch();
    store().beginBatch();
    store().addWall(wall("n1"));
    store().endBatch();
    store().addWall(wall("n2"));
    store().endBatch();
    expect(store().past).toHaveLength(1);
    expect(store().batchDepth).toBe(0);
    expect(store().walls).toHaveLength(2);
  });

  test("endBatch never drives the depth negative", () => {
    store().endBatch();
    store().endBatch();
    expect(store().batchDepth).toBe(0);
    store().addWall(wall("w1"));
    expect(store().past).toHaveLength(1);
  });
});

describe("undo / redo", () => {
  test("are no-ops on empty stacks", () => {
    expect(() => store().undo()).not.toThrow();
    expect(() => store().redo()).not.toThrow();
  });

  test("a new edit clears the redo stack", () => {
    store().addWall(wall("w1"));
    store().undo();
    expect(store().future).toHaveLength(1);
    store().addWall(wall("w2"));
    expect(store().future).toHaveLength(0);
  });

  test("both stacks are capped", () => {
    for (let i = 0; i < 80; i++) store().addWall(wall(`c${i}`));
    expect(store().past).toHaveLength(50);
    for (let i = 0; i < 80; i++) store().undo();
    expect(store().future.length).toBeLessThanOrEqual(50);
  });

  test("snapshots do not alias the live arrays", () => {
    store().addWall(wall("w1"));
    const live = store().walls;
    store().updateWall("w1", { thickness: 200 });
    expect(store().walls).not.toBe(live);
    expect(live[0].thickness).toBe(120);
  });

  test("snapshots deep-copy nested structures", () => {
    store().setRooms(
      [
        room("r1", {
          polygon: [
            [1, 1],
            [2, 1],
            [2, 2],
          ],
        }),
      ],
      { recordHistory: true },
    );
    store().setRooms(
      [
        room("r1", {
          polygon: [
            [5, 5],
            [6, 5],
            [6, 6],
          ],
        }),
      ],
      { recordHistory: true },
    );
    store().undo();
    expect(store().rooms[0].polygon).toEqual([
      [1, 1],
      [2, 1],
      [2, 2],
    ]);
    store().undo();
    expect(store().rooms).toHaveLength(0);
  });
});

describe("mutations", () => {
  test("removing a wall removes the openings on it, and only those", () => {
    store().addWall(wall("w1"));
    store().addWall(wall("w2"));
    store().addOpening(door("d1", "w1"));
    store().addOpening(windowEl("n1", "w2"));

    store().removeWall("w1");

    expect(store().walls.map((w) => w.id)).toEqual(["w2"]);
    expect(store().openings.map((o) => o.id)).toEqual(["n1"]);
  });

  test("removing the selected element clears the selection", () => {
    store().addWall(wall("w1"));
    store().setSelectedElement("w1");
    store().removeWall("w1");
    expect(store().selectedElementId).toBeNull();
  });

  test("removeElement finds the element whatever collection it is in", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1"));
    store().addFurniture(furniture("f1"));
    store().setRooms([room("r1")]);

    for (const id of ["d1", "f1", "r1", "w1"]) store().removeElement(id);

    expect(store().walls).toHaveLength(0);
    expect(store().openings).toHaveLength(0);
    expect(store().furniture).toHaveLength(0);
    expect(store().rooms).toHaveLength(0);
  });

  test("setRooms records history only when asked", () => {
    store().setRooms([room("r1")]);
    expect(store().past).toHaveLength(0);
    store().setRooms([room("r2")], { recordHistory: true });
    expect(store().past).toHaveLength(1);
  });

  test("setCanvas replaces everything and clears transient state", () => {
    store().addWall(wall("old"));
    store().setSelectedElement("old");
    store().setCanvas({ walls: [wall("new")], openings: [], rooms: [room("r1")], furniture: [] });
    expect(store().walls.map((w) => w.id)).toEqual(["new"]);
    expect(store().selectedElementId).toBeNull();
    expect(store().isDrawing).toBe(false);
  });

  test("clearCanvas is undoable", () => {
    store().addWall(wall("w1"));
    store().clearCanvas();
    expect(store().walls).toHaveLength(0);
    store().undo();
    expect(store().walls).toHaveLength(1);
  });

  test("setTool resets in-progress drawing", () => {
    store().setIsDrawing(true);
    store().setCurrentWallStart({ x: 10, y: 10 });
    store().setTool("wall");
    expect(store().isDrawing).toBe(false);
    expect(store().currentWallStart).toBeNull();
  });
});

describe("viewport", () => {
  test("zoom is clamped", () => {
    store().setZoom(99);
    expect(store().zoom).toBe(5);
    store().setZoom(0);
    expect(store().zoom).toBe(0.1);
  });

  test("grid size is clamped to a sensible millimetre range", () => {
    store().setGridSize(5000);
    expect(store().gridSize).toBe(1000);
    store().setGridSize(1);
    expect(store().gridSize).toBe(50);
  });

  test("snapPoint snaps to the grid in millimetres", () => {
    store().setGridSize(200);
    expect(store().snapPoint({ x: 290, y: 310 })).toEqual({ x: 200, y: 400 });
    expect(store().snapPoint({ x: -290, y: -310 })).toEqual({ x: -200, y: -400 });
  });

  test("snapPoint still rounds to whole millimetres when snapping is off", () => {
    store().toggleSnap();
    expect(store().snapPoint({ x: 29.6, y: 31.2 })).toEqual({ x: 30, y: 31 });
  });
});

describe("loadDesign / getCanvas", () => {
  test("loading resets history so a fresh design cannot be undone into the previous one", () => {
    store().addWall(wall("stale"));
    store().loadDesign({
      id: "d1",
      canvasData: {
        version: 1,
        units: "mm",
        walls: [wall("loaded")],
        openings: [],
        rooms: [],
        furniture: [],
      },
    } as never);
    expect(store().walls.map((w) => w.id)).toEqual(["loaded"]);
    expect(store().past).toHaveLength(0);
    expect(store().future).toHaveLength(0);
  });

  test("tolerates a canvasData missing every collection", () => {
    store().loadDesign({ id: "d1", canvasData: {} } as never);
    expect(store().walls).toEqual([]);
    expect(store().openings).toEqual([]);
    expect(store().rooms).toEqual([]);
    expect(store().furniture).toEqual([]);
  });

  test("getCanvas is a complete document with headers and round-trips", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1"));
    store().setRooms([room("r1")]);
    const canvas = store().getCanvas();

    expect(canvas.version).toBe(1);
    expect(canvas.units).toBe("mm");

    store().clearCanvas();
    store().loadDesign({ id: "d1", canvasData: canvas } as never);
    expect(store().walls.map((w) => w.id)).toEqual(["w1"]);
    expect(store().openings.map((o) => o.id)).toEqual(["d1"]);
    expect(store().rooms.map((r) => r.id)).toEqual(["r1"]);
  });

  test("the viewport is not part of the document", () => {
    store().setZoom(2);
    store().setPan(100, 200);
    expect(store().getCanvas()).not.toHaveProperty("zoom");
    expect(store().getCanvas()).not.toHaveProperty("panX");
    expect(store().getCanvas()).not.toHaveProperty("gridSize");
  });
});
