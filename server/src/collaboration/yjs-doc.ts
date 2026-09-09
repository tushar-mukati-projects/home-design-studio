import * as Y from "yjs";
import { CANVAS_COLLECTIONS, emptyCanvas, type Canvas } from "../schemas/canvas.schema";

export const META_KEY = "meta";

export const extractCanvasFromDoc = (doc: Y.Doc): Canvas => {
  const canvas = emptyCanvas();
  for (const key of CANVAS_COLLECTIONS) {
    const items: unknown[] = [];
    doc.getMap(key).forEach((value) => items.push(value));
    (canvas[key] as unknown[]) = items;
  }
  return canvas;
};

export const fillDocFromCanvas = (doc: Y.Doc, canvas: Partial<Canvas>): void => {
  doc.transact(() => {
    for (const key of CANVAS_COLLECTIONS) {
      const map = doc.getMap(key);
      map.clear();
      const items = Array.isArray(canvas[key]) ? (canvas[key] as { id?: unknown }[]) : [];
      for (const item of items) {
        if (item && typeof item.id === "string") map.set(item.id, item);
      }
    }
  });
};

export const buildYjsState = (canvas: Partial<Canvas>): Uint8Array<ArrayBuffer> => {
  const doc = new Y.Doc();
  fillDocFromCanvas(doc, canvas);
  const state = new Uint8Array(Y.encodeStateAsUpdate(doc));
  doc.destroy();
  return state;
};
