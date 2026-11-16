import { describe, test, expect } from "bun:test";
import * as Y from "yjs";
import {
  canvasFromRow,
  designFromState,
  extractCanvasFromDoc,
  fillDocFromCanvas,
  stateFromDesign,
} from "@/collaboration/yjs-doc";
import {
  CANVAS_COLLECTIONS,
  COLLAB_META_KEY,
  emptyCanvas,
  type Canvas,
  type Furniture,
  type Room,
  type Wall,
} from "@/shared/canvas";

const docFromState = (state: Uint8Array): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
};

const stateOf = (canvasData: unknown, name = "Plan") =>
  stateFromDesign({ canvasData, name, ownerUid: "owner" });

const roundTrip = (canvasData: unknown) => designFromState(stateOf(canvasData)).canvas;

const wall: Wall = { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };
const room: Room = {
  id: "r1",
  name: "Living",
  usage: "living_room",
  polygon: [
    [0, 0],
    [1, 0],
    [1, 1],
  ],
};
const sofa: Furniture = { id: "f1", item: "sofa", at: [500, 500], rotation: 90 };

const sample: Canvas = {
  ...emptyCanvas(),
  walls: [wall],
  openings: [{ id: "o1", kind: "door", wall: "w1", offset: 2000, width: 900, height: 2100 }],
  rooms: [room],
  furniture: [sofa],
};

describe("stateFromDesign / designFromState", () => {
  test("round-trips a canvas exactly, headers included", () => {
    expect(roundTrip(sample)).toEqual(sample);
  });

  test("an empty row yields a valid empty canvas", () => {
    expect(roundTrip({})).toEqual(emptyCanvas());
  });

  test.each([
    ["null", null],
    ["a string", "walls"],
    ["an array", [wall]],
  ])("a row that is %s yields an empty canvas", (_label, row) => {
    expect(roundTrip(row)).toEqual(emptyCanvas());
  });

  test("drops items that fail their collection schema", () => {
    const result = roundTrip({
      walls: [wall, { id: "no-ends" }, { ...wall, id: 42 }, null],
      rooms: [{ ...room, polygon: [[0, 0]] }],
      furniture: [{ ...sofa, rotation: "90" }],
    });
    expect(result.walls).toEqual([wall]);
    expect(result.rooms).toEqual([]);
    expect(result.furniture).toEqual([]);
  });

  test("ignores keys that are not collections", () => {
    const result = roundTrip({ walls: [wall], somethingElse: [{ id: "x" }] });
    expect(Object.keys(result).sort()).toEqual([
      "furniture",
      "openings",
      "rooms",
      "units",
      "version",
      "walls",
    ]);
    expect(result.walls).toEqual([wall]);
  });

  test("keeps the last entry when ids collide", () => {
    const result = roundTrip({
      walls: [
        { ...wall, thickness: 100 },
        { ...wall, thickness: 200 },
      ],
    });
    expect(result.walls.map((w) => w.thickness)).toEqual([200]);
  });

  test("the document has exactly one Y.Map per collection", () => {
    const doc = docFromState(stateOf(sample));
    for (const key of CANVAS_COLLECTIONS) expect(doc.getMap(key).size).toBe(1);
  });

  test("writes the name and owner into the meta map", () => {
    const meta = docFromState(stateOf({}, "Kitchen")).getMap(COLLAB_META_KEY);
    expect(meta.get("name")).toBe("Kitchen");
    expect(meta.get("ownerUid")).toBe("owner");
  });

  test.each([
    ["a plain name", "Kitchen", "Kitchen"],
    ["a 255-char name", "k".repeat(255), "k".repeat(255)],
    ["an empty name", "", null],
    ["a 256-char name", "k".repeat(256), null],
    ["a number", 42, null],
    ["an object", { name: "x" }, null],
  ])("reads %s from the meta map", (_label, stored, expected) => {
    const doc = docFromState(stateOf({}));
    doc.getMap(COLLAB_META_KEY).set("name", stored);
    expect(designFromState(Y.encodeStateAsUpdate(doc)).name).toBe(expected);
  });

  test("a malformed item pushed into the live document is not persisted, and is counted", () => {
    const doc = docFromState(stateOf(sample));
    doc.getMap("walls").set("bad", { id: "bad", from: "nowhere" });
    doc.getMap("furniture").set("f2", { ...sofa, id: "f2", at: [1, 2, 3] });
    const { canvas, dropped } = designFromState(Y.encodeStateAsUpdate(doc));
    expect(canvas.walls).toEqual([wall]);
    expect(canvas.furniture).toEqual([sofa]);
    expect(dropped).toEqual({ walls: 1, furniture: 1 });
  });

  test("a valid document drops nothing", () => {
    expect(designFromState(stateOf(sample)).dropped).toEqual({});
  });

  test("loading keeps legacy items untouched in the live document", () => {
    const legacyWall = { ...wall, id: "w2", thickness: 12.5, label: "north" };
    const doc = docFromState(stateOf({ walls: [wall, legacyWall, { from: [0, 0] }] }));
    expect(doc.getMap("walls").get("w2")).toEqual(legacyWall);
    expect(doc.getMap("walls").size).toBe(3);
  });

  test("fillDocFromCanvas replaces, so removed items disappear", () => {
    const doc = docFromState(stateOf(sample));
    fillDocFromCanvas(doc, { ...sample, furniture: [] });
    expect(extractCanvasFromDoc(doc).furniture).toEqual([]);
    expect(extractCanvasFromDoc(doc).walls).toEqual([wall]);
  });

  test("state merges into an existing doc", () => {
    const doc = docFromState(stateOf({ walls: [wall] }));
    Y.applyUpdate(doc, stateOf({ walls: [wall, { ...wall, id: "w2" }] }));
    expect(
      extractCanvasFromDoc(doc)
        .walls.map((w) => w.id)
        .sort(),
    ).toEqual(["w1", "w2"]);
  });
});

describe("canvasFromRow", () => {
  test("fills missing collections and strips unknown item fields", () => {
    const result = canvasFromRow({ walls: [{ ...wall, label: "north" }] });
    expect(result).toEqual({ ...emptyCanvas(), walls: [wall] });
  });
});
