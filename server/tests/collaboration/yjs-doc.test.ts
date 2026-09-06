import { describe, test, expect } from "bun:test";
import * as Y from "yjs";
import {
  buildYjsState,
  extractCanvasFromDoc,
  fillDocFromCanvas,
  META_KEY,
} from "@/collaboration/yjs-doc";
import { CANVAS_COLLECTIONS, emptyCanvas, type Canvas } from "@/schemas/canvas.schema";

const docFromState = (state: Uint8Array): Y.Doc => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  return doc;
};

const roundTrip = (canvas: Partial<Canvas>) =>
  extractCanvasFromDoc(docFromState(buildYjsState(canvas)));

const sample: Canvas = {
  ...emptyCanvas(),
  walls: [{ id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 }],
  openings: [{ id: "o1", kind: "door", wall: "w1", offset: 2000, width: 900, height: 2100 }],
  rooms: [
    {
      id: "r1",
      name: "Living",
      usage: "living_room",
      polygon: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
    },
  ],
  furniture: [{ id: "f1", item: "sofa", at: [500, 500], rotation: 90 }],
};

describe("buildYjsState / extractCanvasFromDoc", () => {
  test("round-trips a canvas exactly, headers included", () => {
    expect(roundTrip(sample)).toEqual(sample);
  });

  test("an empty input yields a valid empty canvas", () => {
    expect(roundTrip({})).toEqual(emptyCanvas());
  });

  test("drops items without a string id", () => {
    const result = roundTrip({
      walls: [{ id: "keep" }, { id: 42 }, { noId: true }, null, undefined] as never,
    });
    expect(result.walls).toEqual([{ id: "keep" }] as never);
  });

  test("ignores keys that are not collections", () => {
    const result = roundTrip({ walls: sample.walls, somethingElse: [{ id: "x" }] } as never);
    expect(Object.keys(result).sort()).toEqual([
      "furniture",
      "openings",
      "rooms",
      "units",
      "version",
      "walls",
    ]);
    expect(result.walls).toEqual(sample.walls);
  });

  test("keeps the last entry when ids collide", () => {
    const result = roundTrip({
      walls: [
        { ...sample.walls[0]!, thickness: 100 },
        { ...sample.walls[0]!, thickness: 200 },
      ],
    });
    expect(result.walls.map((w) => w.thickness)).toEqual([200]);
  });

  test("the document has exactly one Y.Map per collection", () => {
    const doc = docFromState(buildYjsState(sample));
    for (const key of CANVAS_COLLECTIONS) expect(doc.getMap(key).size).toBe(1);
  });

  test("fillDocFromCanvas replaces, so removed items disappear", () => {
    const doc = docFromState(buildYjsState(sample));
    fillDocFromCanvas(doc, { ...sample, furniture: [] });
    expect(extractCanvasFromDoc(doc).furniture).toEqual([]);
    expect(extractCanvasFromDoc(doc).walls).toEqual(sample.walls);
  });

  test("state merges into an existing doc", () => {
    const doc = docFromState(buildYjsState({ walls: [sample.walls[0]!] }));
    Y.applyUpdate(
      doc,
      buildYjsState({ walls: [sample.walls[0]!, { ...sample.walls[0]!, id: "w2" }] }),
    );
    expect(
      extractCanvasFromDoc(doc)
        .walls.map((w) => w.id)
        .sort(),
    ).toEqual(["w1", "w2"]);
  });

  test("the meta map is named consistently for both ends", () => {
    expect(META_KEY).toBe("meta");
  });
});
