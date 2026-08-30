import { describe, test, expect } from "bun:test";
import * as Y from "yjs";
import { buildYjsState, extractCanvasFromDoc, COLLECTION_KEYS } from "@/collaboration/yjs-doc";

const docFromState = (state: Uint8Array): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
};

const roundTrip = (canvas: Record<string, unknown>) =>
  extractCanvasFromDoc(docFromState(buildYjsState(canvas)));

describe("buildYjsState / extractCanvasFromDoc", () => {
  test("round-trips every collection", () => {
    const canvas = {
      walls: [{ id: "w1", x1: 0, y1: 0, x2: 10, y2: 0, thickness: 8, color: "#000" }],
      doors: [{ id: "d1", wallId: "w1", position: 0.5, width: 80, type: "single" }],
      windows: [{ id: "n1", wallId: "w1", position: 0.2, width: 60 }],
      furniture: [{ id: "f1", x: 5, y: 5, rotation: 0, scaleX: 1, scaleY: 1 }],
      rooms: [{ id: "r1", name: "Living", type: "living_room", points: [], area: 100 }],
    };

    expect(roundTrip(canvas)).toEqual(canvas);
  });

  test("returns an empty collection for every key when given nothing", () => {
    const result = roundTrip({});
    for (const key of COLLECTION_KEYS) {
      expect(result[key]).toEqual([]);
    }
  });

  test("drops items without a string id", () => {
    const result = roundTrip({
      walls: [{ id: "keep" }, { id: 42 }, { noId: true }, null, undefined],
    });

    expect(result.walls).toEqual([{ id: "keep" }]);
  });

  test("ignores non-array collection values", () => {
    const result = roundTrip({ walls: "not-an-array", rooms: 7, doors: null });

    expect(result.walls).toEqual([]);
    expect(result.rooms).toEqual([]);
    expect(result.doors).toEqual([]);
  });

  test("ignores unknown keys", () => {
    const result = roundTrip({ walls: [{ id: "w1" }], somethingElse: [{ id: "x" }] });

    expect(result.walls).toEqual([{ id: "w1" }]);
    expect(Object.keys(result).sort()).toEqual([...COLLECTION_KEYS].sort());
  });

  test("keeps the last entry when ids collide", () => {
    const result = roundTrip({
      walls: [
        { id: "dup", color: "first" },
        { id: "dup", color: "second" },
      ],
    });

    expect(result.walls).toEqual([{ id: "dup", color: "second" }]);
  });

  test("produces state that merges into an existing doc", () => {
    const doc = docFromState(buildYjsState({ walls: [{ id: "w1" }] }));
    Y.applyUpdate(doc, buildYjsState({ walls: [{ id: "w1" }, { id: "w2" }] }));

    const ids = extractCanvasFromDoc(doc).walls.map((w) => w.id);
    expect(ids.sort()).toEqual(["w1", "w2"]);
  });

  test("preserves nested structures", () => {
    const rooms = [
      {
        id: "r1",
        points: [
          { x: 1, y: 2 },
          { x: 3, y: 4 },
        ],
      },
    ];
    expect(roundTrip({ rooms }).rooms).toEqual(rooms);
  });
});
