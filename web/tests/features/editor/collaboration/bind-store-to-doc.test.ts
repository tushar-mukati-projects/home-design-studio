import { beforeEach, describe, expect, test } from "bun:test";
import * as Y from "yjs";

import {
  bindStoreToDoc,
  readDesignName,
  writeCollection,
} from "@/features/editor/collaboration/bind-store-to-doc";
import { DEFAULT_DESIGN_NAME } from "@/lib/constants";
import { COLLAB_META_KEY, type Furniture, type Wall } from "@/shared/canvas";
import { HISTORY_RESET } from "@/stores/editor-history";
import { useEditorStore } from "@/stores/editor-store";

const wall = (id: string, overrides: Partial<Wall> = {}): Wall => ({
  id,
  from: [0, 0],
  to: [4000, 0],
  thickness: 120,
  height: 2700,
  ...overrides,
});

const sofa: Furniture = { id: "sofa", item: "sofa-two-seat", at: [500, 500], rotation: 0 };

const docWalls = (doc: Y.Doc): Wall[] =>
  Array.from(doc.getMap<Wall>("walls").values()).sort((a, b) => a.id.localeCompare(b.id));

const docWith = (walls: Wall[]): Y.Doc => {
  const doc = new Y.Doc();
  writeCollection(doc, "walls", walls, []);
  return doc;
};

const applyFrom = (source: Y.Doc, target: Y.Doc): void =>
  Y.applyUpdate(target, Y.encodeStateAsUpdate(source));

const store = () => useEditorStore.getState();

beforeEach(() => {
  useEditorStore.setState({
    walls: [],
    openings: [],
    rooms: [],
    furniture: [],
    ...HISTORY_RESET,
  });
});

describe("readDesignName", () => {
  test.each<[string, unknown, string]>([
    ["a name", "Kitchen", "Kitchen"],
    ["a missing name", undefined, DEFAULT_DESIGN_NAME],
    ["an empty name", "", DEFAULT_DESIGN_NAME],
    ["a non-string name", 42, DEFAULT_DESIGN_NAME],
  ])("reads %s", (_label, stored, expected) => {
    const doc = new Y.Doc();
    if (stored !== undefined) doc.getMap(COLLAB_META_KEY).set("name", stored);
    expect(readDesignName(doc)).toBe(expected);
  });
});

describe("writeCollection", () => {
  const a = wall("a");
  const b = wall("b");
  test.each<[string, Wall[], Wall[], string[]]>([
    ["adds a new item", [a], [a, b], ["b"]],
    ["removes a deleted item", [a, b], [a], ["b"]],
    ["rewrites a replaced item", [a], [wall("a", { height: 3000 })], ["a"]],
    ["leaves an unchanged item alone", [a, b], [a, b], []],
    ["clears everything", [a, b], [], ["a", "b"]],
  ])("%s", (_label, previous, next, changedKeys) => {
    const doc = docWith(previous);
    const changed: string[] = [];
    doc.getMap("walls").observe((event) => changed.push(...event.keysChanged));
    writeCollection(doc, "walls", next, previous);
    expect(changed.sort()).toEqual(changedKeys);
    expect(docWalls(doc)).toEqual(next);
  });
});

describe("bindStoreToDoc", () => {
  test("adopts the server copy, every collection included, and forgets the history", () => {
    const server = docWith([wall("a")]);
    writeCollection(server, "furniture", [sofa], []);
    store().addWall(wall("stale"));
    bindStoreToDoc(server)();
    expect(store().walls).toEqual([wall("a")]);
    expect(store().furniture).toEqual([sofa]);
    expect(store().past).toEqual([]);
  });

  test("an empty server copy empties the store instead of being seeded from it", () => {
    store().addWall(wall("deleted-by-a-peer"));
    const server = new Y.Doc();
    bindStoreToDoc(server)();
    expect(store().walls).toEqual([]);
    expect(docWalls(server)).toEqual([]);
  });

  test("a store edit lands in the doc", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    store().addWall(wall("a"));
    unbind();
    expect(docWalls(doc)).toEqual([wall("a")]);
  });

  test("a remote edit replaces the changed collection and forgets the undo history", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    store().addWall(wall("a"));
    store().addWall(wall("b"));
    store().undo();
    const furniture = store().furniture;
    expect(store().past).toHaveLength(1);
    expect(store().future).toHaveLength(1);
    applyFrom(docWith([wall("remote")]), doc);
    unbind();
    expect(store().walls).toEqual([wall("a"), wall("remote")]);
    expect(store().furniture).toBe(furniture);
    expect(store().past).toEqual([]);
    expect(store().future).toEqual([]);
  });

  test("a remote edit is not echoed back as a local transaction", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    let localTransactions = 0;
    doc.on("afterTransaction", (transaction: Y.Transaction) => {
      if (transaction.local) localTransactions += 1;
    });
    applyFrom(docWith([wall("remote")]), doc);
    unbind();
    expect(localTransactions).toBe(0);
    expect(store().walls).toEqual([wall("remote")]);
  });

  test("undo of one wall edit writes exactly one doc key", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    for (const id of ["a", "b", "c"]) store().addWall(wall(id));
    store().updateWall("b", { thickness: 200 });
    const changed: string[] = [];
    doc.getMap("walls").observe((event) => changed.push(...event.keysChanged));
    store().undo();
    unbind();
    expect(changed).toEqual(["b"]);
  });

  test("a peer's delete during an open batch stays deleted after undo", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    store().addWall(wall("a"));
    store().addWall(wall("b"));
    store().beginBatch();
    const peer = new Y.Doc();
    applyFrom(doc, peer);
    peer.getMap("walls").delete("b");
    applyFrom(peer, doc);
    store().addWall(wall("c"));
    store().endBatch();
    store().undo();
    unbind();
    expect(store().walls).toEqual([wall("a")]);
  });

  test("a malformed item from a peer is left out of the store", () => {
    const doc = new Y.Doc();
    const unbind = bindStoreToDoc(doc);
    const peer = docWith([wall("good")]);
    peer.getMap("walls").set("bad", { id: "bad", from: [0, 0] });
    applyFrom(peer, doc);
    unbind();
    expect(store().walls).toEqual([wall("good")]);
  });

  test("after unbinding, store edits stay out of the doc", () => {
    const doc = new Y.Doc();
    bindStoreToDoc(doc)();
    store().addWall(wall("a"));
    expect(docWalls(doc)).toEqual([]);
  });
});
