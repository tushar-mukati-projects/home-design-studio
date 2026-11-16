import * as Y from "yjs";
import { z, type ZodType } from "zod";
import {
  COLLAB_META_KEY,
  CANVAS_COLLECTIONS,
  designNameSchema,
  emptyCanvas,
  furnitureSchema,
  openingSchema,
  roomSchema,
  wallSchema,
  type Canvas,
  type CanvasCollection,
} from "../shared/canvas";

const looseItems = z.array(z.unknown()).catch([]);
const rowSchema = z
  .object({ walls: looseItems, openings: looseItems, rooms: looseItems, furniture: looseItems })
  .catch({ walls: [], openings: [], rooms: [], furniture: [] });
const keyedItem = z.object({ id: z.string() }).passthrough();

type DesignRow = { canvasData: unknown; name: string; ownerUid: string };
type StoredDesign = {
  canvas: Canvas;
  name: string | null;
  dropped: Partial<Record<CanvasCollection, number>>;
};

export const extractCanvasFromDoc = (doc: Y.Doc): Canvas =>
  canvasFrom((key) => doc.getMap(key).values());

export const canvasFromRow = (canvasData: unknown): Canvas => {
  const row = rowSchema.parse(canvasData);
  return canvasFrom((key) => row[key]);
};

export const fillDocFromCanvas = (doc: Y.Doc, canvas: Canvas): void => {
  doc.transact(() => {
    for (const key of CANVAS_COLLECTIONS) {
      const map = doc.getMap(key);
      map.clear();
      for (const item of canvas[key]) map.set(item.id, item);
    }
  });
};

export const stateFromDesign = ({ canvasData, name, ownerUid }: DesignRow): Uint8Array => {
  const doc = new Y.Doc();
  const row = rowSchema.parse(canvasData);
  doc.transact(() => {
    for (const key of CANVAS_COLLECTIONS) {
      const map = doc.getMap(key);
      row[key].forEach((item, index) =>
        map.set(keyedItem.safeParse(item).data?.id ?? `${index}`, item),
      );
    }
  });
  const meta = doc.getMap(COLLAB_META_KEY);
  meta.set("name", name);
  meta.set("ownerUid", ownerUid);
  const state = Y.encodeStateAsUpdate(doc);
  doc.destroy();
  return state;
};

export const designFromState = (state: Uint8Array): StoredDesign => {
  const doc = new Y.Doc();
  Y.applyUpdate(doc, state);
  const canvas = extractCanvasFromDoc(doc);
  const dropped = Object.fromEntries(
    CANVAS_COLLECTIONS.map(
      (key) => [key, doc.getMap(key).size - canvas[key].length] as const,
    ).filter(([, count]) => count > 0),
  );
  const name = designNameSchema.safeParse(doc.getMap(COLLAB_META_KEY).get("name"));
  doc.destroy();
  return { canvas, name: name.success ? name.data : null, dropped };
};

const validItems = <T>(schema: ZodType<T>, values: Iterable<unknown>): T[] =>
  Array.from(values).flatMap((value) => {
    const parsed = schema.safeParse(value);
    return parsed.success ? [parsed.data] : [];
  });

const canvasFrom = (itemsOf: (key: CanvasCollection) => Iterable<unknown>): Canvas => ({
  ...emptyCanvas(),
  walls: validItems(wallSchema, itemsOf("walls")),
  openings: validItems(openingSchema, itemsOf("openings")),
  rooms: validItems(roomSchema, itemsOf("rooms")),
  furniture: validItems(furnitureSchema, itemsOf("furniture")),
});
