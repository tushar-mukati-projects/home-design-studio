import { describe, test, expect, beforeEach } from "bun:test";
import { useEditorStore } from "@/stores/editor-store";
import { MAX_ZOOM, MIN_ZOOM } from "@/lib/constants";
import type { Furniture, Opening, Room, Wall } from "@/shared/canvas";

const store = () => useEditorStore.getState();

const wall = (id: string, overrides: Partial<Wall> = {}): Wall => ({
  id,
  from: [0, 0],
  to: [4000, 0],
  thickness: 120,
  height: 2700,
  ...overrides,
});

const door = (id: string, wallId = "w1", overrides: Partial<Opening> = {}): Opening => ({
  id,
  kind: "door",
  wall: wallId,
  offset: 2000,
  width: 900,
  height: 2100,
  ...overrides,
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
    openModals: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
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
    let width = 800;
    let rotation = 5;
    for (const drag of [
      () => store().updateOpening("d1", { width: width++ }, "opening-width:d1"),
      () => store().updateFurniture("f1", { rotation: rotation++ }, "furniture-rotation:f1"),
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

describe("unchanged edits", () => {
  test("updateWall with the same thickness leaves past.length unchanged", () => {
    store().addWall(wall("w1"));
    const before = store().past.length;
    store().updateWall("w1", { thickness: 120 });
    expect(store().past.length).toBe(before);
  });

  test.each([
    [
      "opening",
      () => store().addOpening(door("x")),
      () => store().updateOpening("x", { width: 900 }),
    ],
    [
      "furniture",
      () => store().addFurniture(furniture("x")),
      () => store().updateFurniture("x", { at: [0, 0] }),
    ],
    ["room", () => store().setRooms([room("x")]), () => store().updateRoom("x", { name: "Room" })],
  ])("an unchanged %s patch is not an undo step", (_kind, add, patch) => {
    add();
    const before = store().past.length;
    patch();
    expect(store().past.length).toBe(before);
  });

  test("updateRoom records a real change once", () => {
    store().setRooms([room("r1")]);
    store().updateRoom("r1", { name: "Kitchen" });
    expect(store().rooms[0].name).toBe("Kitchen");
    expect(store().past).toHaveLength(2);
  });
});

describe("batching", () => {
  test("many mutations collapse into one undo step", () => {
    store().beginBatch();
    store().addWall(wall("x1"));
    store().addWall(wall("x2"));
    store().setRooms([room("r1")]);
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

  test("a batch is one undo step however long it pauses", () => {
    store().addWall(wall("w1"));
    useEditorStore.setState({ lastCoalesceAt: Date.now() - 5000 });
    store().beginBatch();
    for (let x = 4100; x <= 4500; x += 100) store().updateWall("w1", { to: [x, 0] });
    store().endBatch();
    expect(store().past).toHaveLength(2);
    store().undo();
    expect(store().walls[0].to).toEqual([4000, 0]);
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

  test("the undo stack keeps only the last 50 steps", () => {
    for (let i = 0; i < 80; i++) store().addWall(wall(`c${i}`));
    expect(store().past).toHaveLength(50);
    for (let i = 0; i < 80; i++) store().undo();
    expect(store().walls).toHaveLength(30);
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

  test("removing a wall clears a selected opening that went with it", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1"));
    store().setSelectedElement("d1");
    store().removeWall("w1");
    expect(store().selectedElementId).toBeNull();
  });

  test("a remote delete of the selected element clears the selection", () => {
    store().addFurniture(furniture("f1"));
    store().setSelectedElement("f1");
    useEditorStore.setState({ furniture: [] });
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

  test("setRooms records history", () => {
    store().setRooms([room("r1")]);
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

  test("stopDrawing ends the wall in progress", () => {
    store().setIsDrawing(true);
    store().setCurrentWallStart({ x: 10, y: 10 });
    store().stopDrawing();
    expect(store().isDrawing).toBe(false);
    expect(store().currentWallStart).toBeNull();
  });

  test("open modals are counted and never go negative", () => {
    store().setModalOpen(true);
    store().setModalOpen(true);
    expect(store().openModals).toBe(2);
    store().setModalOpen(false);
    store().setModalOpen(false);
    store().setModalOpen(false);
    expect(store().openModals).toBe(0);
  });
});

describe("openings follow their wall", () => {
  test("shrinking a wall from the inputs keeps its door on the wall", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1", { offset: 3500 }));
    store().updateWall("w1", { to: [2000, 0] });
    expect(store().openings[0].offset).toBe(1550);
    expect(store().openings[0].width).toBe(900);
  });

  test("a wall shorter than its opening keeps the opening width and centres it", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1"));
    store().updateWall("w1", { to: [500, 0] });
    expect(store().openings[0]).toMatchObject({ width: 900, offset: 250 });
  });

  test("a wall end dragged onto the other end is ignored, so the door keeps its size", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1"));
    store().updateWall("w1", { to: [0, 0] }, "wall-end:w1:to");
    expect(store().walls[0].to).toEqual([4000, 0]);
    expect(store().openings[0]).toMatchObject({ width: 900, offset: 2000 });
    expect(store().past).toHaveLength(2);
  });

  test("a live handle drag re-clamps on every move", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1", { offset: 3500 }));
    store().beginBatch();
    store().updateWall("w1", { to: [3000, 0] });
    expect(store().openings[0].offset).toBe(2550);
    store().updateWall("w1", { to: [2000, 0] });
    store().endBatch();
    expect(store().openings[0].offset).toBe(1550);
  });

  test("openings on other walls are left alone", () => {
    store().addWall(wall("w1"));
    store().addWall(wall("w2", { from: [0, 3000], to: [4000, 3000] }));
    store().addOpening(door("d2", "w2", { offset: 3500 }));
    store().updateWall("w1", { to: [1000, 0] });
    expect(store().openings[0].offset).toBe(3500);
  });
});

describe("snapWallPoint", () => {
  test("joins a nearby wall end exactly, ignoring the grid", () => {
    store().addWall(wall("w1", { from: [0, 0], to: [4130, 70] }));
    const { point, joined } = store().snapWallPoint({ x: 4180, y: 40 });
    expect(joined).toEqual([4130, 70]);
    expect(point).toEqual({ x: 4130, y: 70 });
  });

  test("the wall being edited does not snap to itself", () => {
    store().addWall(wall("w1", { from: [0, 0], to: [4000, 0] }));
    const { joined } = store().snapWallPoint({ x: 4010, y: 10 }, { ignoreWallId: "w1" });
    expect(joined).toBeNull();
  });

  test("Shift holds the angle from the start point, then the grid rounds the length", () => {
    store().setCurrentWallStart({ x: 0, y: 0 });
    const { point } = store().snapWallPoint({ x: 3000, y: 240 }, { shift: true });
    expect(point).toEqual({ x: 3000, y: 0 });
    const diagonal = store().snapWallPoint({ x: 2000, y: 2200 }, { shift: true }).point;
    expect(diagonal.x).toBe(diagonal.y);
  });

  test("Shift keeps the angle when the start point is off the grid", () => {
    store().setCurrentWallStart({ x: 50, y: 50 });
    const { point } = store().snapWallPoint({ x: 1050, y: 60 }, { shift: true });
    expect(point).toEqual({ x: 1050, y: 50 });
  });

  test("Shift without grid snapping keeps the exact length", () => {
    store().toggleSnap();
    store().setCurrentWallStart({ x: 0, y: 0 });
    expect(store().snapWallPoint({ x: 1000, y: 100 }, { shift: true }).point).toEqual({
      x: 1005,
      y: 0,
    });
  });

  test("falls back to the grid otherwise", () => {
    expect(store().snapWallPoint({ x: 310, y: 90 }).point).toEqual({ x: 400, y: 0 });
  });
});

describe("nudge", () => {
  test("arrow-key nudges move the selected wall and coalesce into one undo step", () => {
    store().addWall(wall("w1"));
    store().setSelectedElement("w1");
    const before = store().past.length;
    for (let i = 0; i < 5; i++) store().nudgeSelected(200, 0);
    expect(store().walls[0].from).toEqual([1000, 0]);
    expect(store().walls[0].to).toEqual([5000, 0]);
    expect(store().past.length - before).toBe(1);
  });

  test("nudging furniture moves its centre", () => {
    store().addFurniture(furniture("f1"));
    store().setSelectedElement("f1");
    store().nudgeSelected(0, -200);
    expect(store().furniture[0].at).toEqual([0, -200]);
  });

  test("nudging an opening slides it along its wall and stays on it", () => {
    store().addWall(wall("w1"));
    store().addOpening(door("d1", "w1"));
    store().setSelectedElement("d1");
    store().nudgeSelected(200, 0);
    expect(store().openings[0].offset).toBe(2200);
    store().nudgeSelected(0, 200);
    expect(store().openings[0].offset).toBe(2200);
    store().nudgeSelected(5000, 0);
    expect(store().openings[0].offset).toBe(3550);
  });

  test("nudge with nothing selected is a no-op", () => {
    store().addWall(wall("w1"));
    store().nudgeSelected(200, 0);
    expect(store().walls[0].from).toEqual([0, 0]);
    expect(store().past).toHaveLength(1);
  });
});

describe("viewport", () => {
  test("zoom is clamped", () => {
    store().setZoom(99);
    expect(store().zoom).toBe(MAX_ZOOM);
    store().setZoom(0);
    expect(store().zoom).toBe(MIN_ZOOM);
  });

  test("snapPoint snaps to the grid in millimetres", () => {
    expect(store().snapPoint({ x: 290, y: 310 })).toEqual({ x: 200, y: 400 });
    expect(store().snapPoint({ x: -290, y: -310 })).toEqual({ x: -200, y: -400 });
  });

  test("snapPoint still rounds to whole millimetres when snapping is off", () => {
    store().toggleSnap();
    expect(store().snapPoint({ x: 29.6, y: 31.2 })).toEqual({ x: 30, y: 31 });
  });
});

describe("loadDesign", () => {
  test("loading resets history so a fresh design cannot be undone into the previous one", () => {
    store().addWall(wall("stale"));
    store().loadDesign({
      id: "d1",
      name: "Design",
      description: null,
      thumbnail: null,
      userId: "me",
      createdAt: "",
      updatedAt: "",
      rooms: [],
      furniture: [],
      canvasData: {
        version: 1,
        units: "mm",
        walls: [wall("loaded")],
        openings: [],
        rooms: [],
        furniture: [],
      },
    });
    expect(store().walls.map((w) => w.id)).toEqual(["loaded"]);
    expect(store().past).toHaveLength(0);
    expect(store().future).toHaveLength(0);
  });
});
