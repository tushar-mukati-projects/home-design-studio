import * as Y from "yjs";
import { z } from "zod";

import { DEFAULT_DESIGN_NAME } from "@/lib/constants";
import {
  CANVAS_COLLECTIONS,
  COLLAB_META_KEY,
  designNameSchema,
  furnitureSchema,
  openingSchema,
  roomSchema,
  wallSchema,
  type CanvasCollection,
} from "@/shared/canvas";
import type { Collections } from "@/stores/editor-history";
import { useEditorStore } from "@/stores/editor-store";

type Item = { id: string };
type Unbind = () => void;

const ITEM_SCHEMAS: Record<CanvasCollection, z.ZodType<Item>> = {
  walls: wallSchema,
  openings: openingSchema,
  rooms: roomSchema,
  furniture: furnitureSchema,
};

export const readDesignName = (doc: Y.Doc): string =>
  designNameSchema
    .catch(DEFAULT_DESIGN_NAME)
    .parse(doc.getMap<unknown>(COLLAB_META_KEY).get("name"));

export const adoptCollections = (doc: Y.Doc, keys: readonly CanvasCollection[]): void =>
  useEditorStore.getState().replaceCollections(readCollections(doc, keys));

export const bindStoreToDoc = (doc: Y.Doc): Unbind => {
  const collectionOf = new Map<unknown, CanvasCollection>(
    CANVAS_COLLECTIONS.map((key) => [doc.getMap(key), key]),
  );
  let applyingRemote = false;
  const onTransaction = (transaction: Y.Transaction) => {
    if (transaction.local) return;
    const changed = Array.from(transaction.changedParentTypes.keys()).flatMap(
      (type) => collectionOf.get(type) ?? [],
    );
    if (changed.length === 0) return;
    applyingRemote = true;
    adoptCollections(doc, changed);
    applyingRemote = false;
  };
  adoptCollections(doc, CANVAS_COLLECTIONS);
  const unsubscribe = useEditorStore.subscribe((state, previous) => {
    if (applyingRemote) return;
    for (const key of CANVAS_COLLECTIONS) {
      if (state[key] !== previous[key]) writeCollection(doc, key, state[key], previous[key]);
    }
  });
  doc.on("afterTransaction", onTransaction);
  return () => {
    doc.off("afterTransaction", onTransaction);
    unsubscribe();
  };
};

export const writeCollection = (
  doc: Y.Doc,
  key: CanvasCollection,
  items: Item[],
  previous: Item[],
): void => {
  const map = doc.getMap<Item>(key);
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const ids = new Set(items.map((item) => item.id));
  doc.transact(() => {
    for (const id of map.keys()) if (!ids.has(id)) map.delete(id);
    for (const item of items) {
      if (previousById.get(item.id) !== item || !map.has(item.id)) {
        map.set(item.id, structuredClone(item));
      }
    }
  });
};

const readCollections = (doc: Y.Doc, keys: readonly CanvasCollection[]): Partial<Collections> =>
  Object.fromEntries(
    keys.map((key) => [
      key,
      Array.from(doc.getMap<unknown>(key).values()).flatMap((value) => {
        const parsed = ITEM_SCHEMAS[key].safeParse(value);
        return parsed.success ? [parsed.data] : [];
      }),
    ]),
  ) as Partial<Collections>;
