import * as Y from "yjs";

export const COLLECTION_KEYS = ["walls", "doors", "windows", "furniture", "rooms"] as const;

export const extractCanvasFromDoc = (doc: Y.Doc) => {
  const toArray = (yMap: Y.Map<unknown>) => {
    const arr: Record<string, unknown>[] = [];
    yMap.forEach((v) => arr.push(v as Record<string, unknown>));
    return arr;
  };

  return {
    walls: toArray(doc.getMap("walls")),
    doors: toArray(doc.getMap("doors")),
    windows: toArray(doc.getMap("windows")),
    furniture: toArray(doc.getMap("furniture")),
    rooms: toArray(doc.getMap("rooms")),
  };
};

export const buildYjsState = (canvas: Record<string, unknown>): Uint8Array<ArrayBuffer> => {
  const doc = new Y.Doc();
  doc.transact(() => {
    for (const key of COLLECTION_KEYS) {
      const map = doc.getMap(key);
      const arr = Array.isArray(canvas[key]) ? (canvas[key] as Array<Record<string, unknown>>) : [];
      for (const item of arr) {
        if (item && typeof item.id === "string") {
          map.set(item.id, item);
        }
      }
    }
  });
  const state = new Uint8Array(Y.encodeStateAsUpdate(doc));
  doc.destroy();
  return state;
};
