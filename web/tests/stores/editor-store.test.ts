import { describe, test, expect, beforeEach } from "bun:test";
import { useEditorStore } from "@/stores/editor-store";
import type { Door, PlacedFurniture, Room, Wall, Window } from "@/types";

const store = () => useEditorStore.getState();

const wall = (id: string, overrides: Partial<Wall> = {}): Wall => ({
  id,
  x1: 0,
  y1: 0,
  x2: 100,
  y2: 0,
  thickness: 8,
  color: "#000000",
  ...overrides,
});

const door = (id: string): Door => ({
  id,
  wallId: "w1",
  position: 0.5,
  width: 80,
  type: "single",
});

const windowEl = (id: string): Window => ({ id, wallId: "w1", position: 0.5, width: 60 });

const room = (id: string): Room => ({
  id,
  name: "Room",
  type: "generic",
  color: "#eeeeee",
  points: [],
  area: 0,
});

const furniture = (id: string): PlacedFurniture =>
  ({
    id,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    furnitureItem: { id: "i1", name: "Sofa", category: "living-room", width: 200, height: 90 },
  }) as unknown as PlacedFurniture;

beforeEach(() => {
  useEditorStore.setState({
    walls: [],
    doors: [],
    windows: [],
    furniture: [],
    rooms: [],
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
    gridSize: 20,
    showGrid: true,
    snapToGrid: true,
  });
});

describe("history coalescing", () => {
  test("a slider drag collapses into one undo step", () => {
    store().addWall(wall("w1"));
    const before = store().past.length;

    for (let thickness = 5; thickness <= 30; thickness++) {
      store().updateWall("w1", { thickness }, "wall-thickness:w1");
    }

    expect(store().past.length - before).toBe(1);
    expect(store().walls[0].thickness).toBe(30);
  });

  test("one undo reverts the whole drag", () => {
    store().addWall(wall("w1"));
    for (let thickness = 5; thickness <= 30; thickness++) {
      store().updateWall("w1", { thickness }, "wall-thickness:w1");
    }

    store().undo();
    expect(store().walls[0].thickness).toBe(8);
  });

  test("redo reapplies the whole drag", () => {
    store().addWall(wall("w1"));
    for (let thickness = 5; thickness <= 30; thickness++) {
      store().updateWall("w1", { thickness }, "wall-thickness:w1");
    }

    store().undo();
    store().redo();
    expect(store().walls[0].thickness).toBe(30);
  });

  test("different coalesce keys stay separate", () => {
    store().addWall(wall("a"));
    store().addWall(wall("b"));
    const before = store().past.length;

    store().updateWall("a", { thickness: 10 }, "wall-thickness:a");
    store().updateWall("b", { thickness: 10 }, "wall-thickness:b");

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
    store().updateWall("w1", { thickness: 20 }, "k");
    store().undo();
    const before = store().past.length;

    store().updateWall("w1", { thickness: 25 }, "k");
    expect(store().past.length - before).toBe(1);
  });

  test("coalescing works for doors, windows and furniture", () => {
    store().addDoor(door("d1"));
    store().addWindow(windowEl("n1"));
    store().addFurniture(furniture("f1"));

    for (const drag of [
      () => store().updateDoor("d1", { width: 40 }, "door-width:d1"),
      () => store().updateWindow("n1", { width: 30 }, "window-width:n1"),
      () => store().updateFurniture("f1", { rotation: 5 }, "furniture-rotation:f1"),
    ]) {
      const before = store().past.length;
      for (let i = 0; i < 10; i++) drag();
      expect(store().past.length - before).toBe(1);
    }
  });

  test("only the most recent key coalesces, so interleaved drags do not merge", () => {
    store().addDoor(door("d1"));
    store().addWindow(windowEl("n1"));
    const before = store().past.length;

    store().updateDoor("d1", { width: 40 }, "door-width:d1");
    store().updateWindow("n1", { width: 30 }, "window-width:n1");
    store().updateDoor("d1", { width: 41 }, "door-width:d1");

    expect(store().past.length - before).toBe(3);
  });
});

describe("batching", () => {
  test("many mutations collapse into one undo step", () => {
    store().beginBatch();
    store().addWall(wall("x1"));
    store().addWall(wall("x2"));
    store().addWall(wall("x3"));
    store().setRooms([room("r1")], { recordHistory: true });
    store().endBatch();

    expect(store().past.length).toBe(1);
    expect(store().walls).toHaveLength(3);

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
    expect(store().walls).toHaveLength(0);
  });

  test("a new edit clears the redo stack", () => {
    store().addWall(wall("w1"));
    store().undo();
    expect(store().future).toHaveLength(1);

    store().addWall(wall("w2"));
    expect(store().future).toHaveLength(0);
  });

  test("history is capped", () => {
    for (let i = 0; i < 80; i++) store().addWall(wall(`c${i}`));
    expect(store().past).toHaveLength(50);
  });

  test("the redo stack is also capped", () => {
    for (let i = 0; i < 80; i++) store().addWall(wall(`c${i}`));
    for (let i = 0; i < 80; i++) store().undo();
    expect(store().future.length).toBeLessThanOrEqual(50);
  });

  test("snapshots do not alias the live arrays", () => {
    store().addWall(wall("w1"));
    const liveWalls = store().walls;

    store().updateWall("w1", { thickness: 20 });

    expect(store().walls).not.toBe(liveWalls);
    expect(liveWalls[0].thickness).toBe(8);
  });

  test("snapshots deep-copy nested structures", () => {
    store().setRooms([{ ...room("r1"), points: [{ x: 1, y: 1 }] }], { recordHistory: true });
    store().setRooms([{ ...room("r1"), points: [{ x: 2, y: 2 }] }], { recordHistory: true });

    store().undo();
    expect(store().rooms[0].points).toEqual([{ x: 1, y: 1 }]);

    store().undo();
    expect(store().rooms).toHaveLength(0);
  });
});

describe("mutations", () => {
  test("removing a wall removes its doors and windows", () => {
    store().addWall(wall("w1"));
    store().addDoor(door("d1"));
    store().addWindow(windowEl("n1"));

    store().removeWall("w1");

    expect(store().walls).toHaveLength(0);
    expect(store().doors).toHaveLength(0);
    expect(store().windows).toHaveLength(0);
  });

  test("removing the selected element clears the selection", () => {
    store().addWall(wall("w1"));
    store().setSelectedElement("w1");
    store().removeWall("w1");

    expect(store().selectedElementId).toBeNull();
  });

  test("removing another element keeps the selection", () => {
    store().addWall(wall("w1"));
    store().addWall(wall("w2"));
    store().setSelectedElement("w1");
    store().removeWall("w2");

    expect(store().selectedElementId).toBe("w1");
  });

  test("setRooms does not record history by default", () => {
    store().setRooms([room("r1")]);
    expect(store().past).toHaveLength(0);
    expect(store().rooms).toHaveLength(1);
  });

  test("setRooms records history when asked", () => {
    store().setRooms([room("r1")], { recordHistory: true });
    expect(store().past).toHaveLength(1);
  });

  test("setCanvas replaces everything and clears transient state", () => {
    store().addWall(wall("old"));
    store().setSelectedElement("old");

    store().setCanvas({
      walls: [wall("new")],
      rooms: [room("r1")],
      furniture: [],
      doors: [],
      windows: [],
    });

    expect(store().walls.map((w) => w.id)).toEqual(["new"]);
    expect(store().selectedElementId).toBeNull();
    expect(store().isDrawing).toBe(false);
    expect(store().currentWallStart).toBeNull();
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
    expect(store().selectedElementId).toBeNull();
  });
});

describe("viewport", () => {
  test("zoom is clamped", () => {
    store().setZoom(99);
    expect(store().zoom).toBe(5);
    store().setZoom(0);
    expect(store().zoom).toBe(0.1);
  });

  test("grid size is clamped", () => {
    store().setGridSize(1000);
    expect(store().gridSize).toBe(100);
    store().setGridSize(1);
    expect(store().gridSize).toBe(5);
  });

  test("snapPoint snaps to the grid", () => {
    store().setGridSize(20);
    expect(store().snapPoint({ x: 29, y: 31 })).toEqual({ x: 20, y: 40 });
  });

  test("snapPoint is a pass-through when snapping is off", () => {
    store().toggleSnap();
    expect(store().snapToGrid).toBe(false);
    expect(store().snapPoint({ x: 29, y: 31 })).toEqual({ x: 29, y: 31 });
  });

  test("snapping handles negative coordinates", () => {
    store().setGridSize(20);
    expect(store().snapPoint({ x: -29, y: -31 })).toEqual({ x: -20, y: -40 });
  });
});

describe("loadDesign", () => {
  test("resets history so a fresh design cannot be undone into the previous one", () => {
    store().addWall(wall("stale"));

    store().loadDesign({
      id: "d1",
      canvasData: { walls: [wall("loaded")], doors: [], windows: [], rooms: [], furniture: [] },
    } as never);

    expect(store().walls.map((w) => w.id)).toEqual(["loaded"]);
    expect(store().past).toHaveLength(0);
    expect(store().future).toHaveLength(0);
    expect(store().batchDepth).toBe(0);
  });

  test("reads rooms and furniture from canvasData, the single source of truth", () => {
    store().loadDesign({
      id: "d1",
      canvasData: { walls: [], rooms: [room("from-canvas")], furniture: [] },
    } as never);

    expect(store().rooms.map((r) => r.id)).toEqual(["from-canvas"]);
  });

  test("tolerates a canvasData missing every collection", () => {
    store().loadDesign({ id: "d1", canvasData: {} } as never);

    expect(store().walls).toEqual([]);
    expect(store().rooms).toEqual([]);
    expect(store().gridSize).toBe(20);
    expect(store().zoom).toBe(1);
  });
});

describe("getCanvasData", () => {
  test("round-trips through loadDesign", () => {
    store().addWall(wall("w1"));
    store().addDoor(door("d1"));
    store().setRooms([room("r1")]);
    const snapshot = store().getCanvasData();

    store().clearCanvas();
    store().loadDesign({ id: "d1", canvasData: snapshot } as never);

    expect(store().walls.map((w) => w.id)).toEqual(["w1"]);
    expect(store().doors.map((d) => d.id)).toEqual(["d1"]);
    expect(store().rooms.map((r) => r.id)).toEqual(["r1"]);
  });
});
