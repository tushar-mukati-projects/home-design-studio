import { describe, test, expect } from "bun:test";
import type { EditCanvasInput } from "@/services/design-chat/tool-input";
import { editCanvas, newSession, setCanvas, type ChatSession } from "@/services/design-chat/tools";
import { DEFAULTS, emptyCanvas, type CatalogItem, type Wall } from "@/shared/canvas";

const sofa: CatalogItem = {
  id: "sofa",
  name: "Sofa",
  category: "living_room",
  size: [2000, 900, 800],
  color: "#aabbcc",
};

const wall: Wall = { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };

const loaded = (): ChatSession => ({ ...newSession(), catalog: [sofa], loaded: true });

describe("editCanvas", () => {
  test("refuses edits before fetch_canvas", () => {
    const session = newSession();
    expect(editCanvas(session, { operation: "clear_all" })).toEqual({
      summary: "Call fetch_canvas first before editing.",
    });
    expect(session.dirty).toBe(false);
  });

  test.each<[EditCanvasInput, string]>([
    [{ operation: "add_wall", from: [0, 0] }, "add_wall requires from and to"],
    [
      { operation: "add_room", name: "Living", usage: "living_room", x: 0, y: 0, width: 100 },
      "add_room requires name, usage, x, y, width, height",
    ],
    [{ operation: "place_furniture", item: "sofa" }, "place_furniture requires item and at"],
    [
      { operation: "add_opening", kind: "door", offset: 10 },
      "add_opening requires kind, wallIndex and offset",
    ],
    [
      { operation: "remove_element", collection: "walls" },
      "remove_element requires collection and elementId",
    ],
  ])("%j without its required fields leaves the plan untouched", (input, summary) => {
    const session = loaded();
    expect(editCanvas(session, input)).toEqual({ summary });
    expect(session.canvas).toEqual(emptyCanvas());
    expect(session.dirty).toBe(false);
  });

  test("add_wall appends a wall with the default thickness and height", () => {
    const session = loaded();
    const result = editCanvas(session, { operation: "add_wall", from: [0, 0], to: [3000, 0] });
    expect(session.canvas.walls).toHaveLength(1);
    expect(session.canvas.walls[0]).toMatchObject({
      from: [0, 0],
      to: [3000, 0],
      thickness: DEFAULTS.wallThickness,
      height: DEFAULTS.wallHeight,
    });
    expect(result.action).toEqual({ actionType: "add_wall", payload: session.canvas.walls[0] });
    expect(session.dirty).toBe(true);
  });

  test("add_room turns x, y, width and height into a clockwise rectangle", () => {
    const session = loaded();
    editCanvas(session, {
      operation: "add_room",
      name: "Living",
      usage: "living_room",
      x: 400,
      y: 400,
      width: 4000,
      height: 3000,
    });
    expect(session.canvas.rooms[0]?.polygon).toEqual([
      [400, 400],
      [4400, 400],
      [4400, 3400],
      [400, 3400],
    ]);
  });

  test("place_furniture rejects an id that is not in the catalog", () => {
    const session = loaded();
    const result = editCanvas(session, { operation: "place_furniture", item: "piano", at: [1, 1] });
    expect(result).toEqual({ summary: 'Unknown item "piano". Valid ids: sofa' });
    expect(session.canvas.furniture).toEqual([]);
  });

  test("place_furniture defaults the rotation to 0", () => {
    const session = loaded();
    const result = editCanvas(session, { operation: "place_furniture", item: "sofa", at: [1, 2] });
    expect(session.canvas.furniture[0]).toMatchObject({ item: "sofa", at: [1, 2], rotation: 0 });
    expect(result.action?.actionType).toBe("place_furniture");
  });

  test("add_opening rejects a wall index that does not exist", () => {
    const session = loaded();
    session.canvas.walls.push(wall);
    const result = editCanvas(session, {
      operation: "add_opening",
      kind: "door",
      wallIndex: 3,
      offset: 10,
    });
    expect(result).toEqual({ summary: "No wall at index 3. Valid: 0–0" });
    expect(session.canvas.openings).toEqual([]);
  });

  test.each([
    ["door", { width: DEFAULTS.door.width, variant: "single", hinge: "left", swing: "in" }],
    ["window", { width: DEFAULTS.window.width, sill: DEFAULTS.window.sill }],
  ] as const)("add_opening fills the %s defaults", (kind, expected) => {
    const session = loaded();
    session.canvas.walls.push(wall);
    editCanvas(session, { operation: "add_opening", kind, wallIndex: 0, offset: 2000 });
    expect(session.canvas.openings[0]).toMatchObject({
      kind,
      wall: "w1",
      offset: 2000,
      ...expected,
    });
  });

  test("removing a wall also removes the openings on it", () => {
    const session = loaded();
    session.canvas.walls.push(wall, { ...wall, id: "w2" });
    editCanvas(session, { operation: "add_opening", kind: "door", wallIndex: 0, offset: 100 });
    editCanvas(session, { operation: "add_opening", kind: "window", wallIndex: 1, offset: 100 });
    const result = editCanvas(session, {
      operation: "remove_element",
      collection: "walls",
      elementId: "w1",
    });
    expect(result.action).toEqual({
      actionType: "remove_element",
      payload: { collection: "walls", elementId: "w1" },
    });
    expect(session.canvas.walls.map((w) => w.id)).toEqual(["w2"]);
    expect(session.canvas.openings.map((o) => o.wall)).toEqual(["w2"]);
  });

  test("remove_element reports an unknown id without changing anything", () => {
    const session = loaded();
    session.canvas.walls.push(wall);
    const result = editCanvas(session, {
      operation: "remove_element",
      collection: "rooms",
      elementId: "nope",
    });
    expect(result).toEqual({ summary: "No rooms entry with id nope" });
    expect(session.canvas.walls).toEqual([wall]);
    expect(session.dirty).toBe(false);
  });

  test("clear_all empties the plan", () => {
    const session = loaded();
    session.canvas.walls.push(wall);
    const result = editCanvas(session, { operation: "clear_all" });
    expect(session.canvas).toEqual(emptyCanvas());
    expect(result.action).toEqual({ actionType: "clear_design", payload: {} });
  });
});

describe("setCanvas", () => {
  test("refuses to run before fetch_canvas", () => {
    const session = newSession();
    expect(setCanvas(session, { walls: [], rooms: [], furniture: [], openings: [] })).toEqual({
      summary: "Call fetch_canvas first to load the catalog.",
    });
  });

  test("rejects unknown furniture ids before touching the plan", () => {
    const session = loaded();
    session.canvas.walls.push(wall);
    const result = setCanvas(session, {
      walls: [],
      rooms: [],
      furniture: [
        { item: "sofa", at: [1, 1] },
        { item: "piano", at: [1, 1] },
        { item: "harp", at: [1, 1] },
      ],
      openings: [],
    });
    expect(result).toEqual({
      summary: "Unknown furniture ids: piano, harp. Use ids from fetch_canvas.",
    });
    expect(session.canvas.walls).toEqual([wall]);
    expect(session.dirty).toBe(false);
  });

  test("builds the whole plan and drops openings whose wall index is out of range", () => {
    const session = loaded();
    const result = setCanvas(session, {
      walls: [{ from: [0, 0], to: [4000, 0] }],
      rooms: [{ name: "Living", usage: "living_room", x: 0, y: 0, width: 4000, height: 3000 }],
      furniture: [{ item: "sofa", at: [2000, 1500], rotation: 90 }],
      openings: [
        { kind: "door", wallIndex: 0, offset: 2000 },
        { kind: "window", wallIndex: 7, offset: 10 },
      ],
    });
    const { canvas } = session;
    expect(canvas.walls[0]).toMatchObject({ from: [0, 0], to: [4000, 0], thickness: 120 });
    expect(canvas.rooms[0]).toMatchObject({ name: "Living", usage: "living_room" });
    expect(canvas.furniture[0]).toMatchObject({ item: "sofa", at: [2000, 1500], rotation: 90 });
    expect(canvas.openings).toHaveLength(1);
    expect(canvas.openings[0]).toMatchObject({
      kind: "door",
      wall: canvas.walls[0]?.id,
      offset: 2000,
    });
    expect(result.summary).toBe("Canvas set: 1 walls, 1 rooms, 1 furniture, 1 openings.");
    expect(result.action).toEqual({ actionType: "set_canvas", payload: canvas });
    expect(session.dirty).toBe(true);
  });
});
