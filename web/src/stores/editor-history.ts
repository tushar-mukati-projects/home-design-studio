import type { Canvas, CanvasCollection } from "@/shared/canvas";

export type Collections = Pick<Canvas, CanvasCollection>;

export type History = {
  past: Collections[];
  future: Collections[];
  batchDepth: number;
  pendingBatchSnapshot: Collections | null;
  lastCoalesceKey: string | null;
  lastCoalesceAt: number;
};

type HistoryPatch = Partial<History>;

export const MAX_HISTORY = 50;
const HISTORY_COALESCE_MS = 700;

export const COALESCE_RESET = { lastCoalesceKey: null, lastCoalesceAt: 0 } as const;

export const HISTORY_RESET: History = {
  past: [],
  future: [],
  batchDepth: 0,
  pendingBatchSnapshot: null,
  ...COALESCE_RESET,
};

export const snapshot = ({ walls, openings, rooms, furniture }: Collections): Collections => ({
  walls,
  openings,
  rooms,
  furniture,
});

export const appendSnapshot = (past: Collections[], entry: Collections): Collections[] => [
  ...past.slice(-MAX_HISTORY + 1),
  entry,
];

export const sameFields = <T extends object>(current: T, updates: Partial<T>) =>
  (Object.keys(updates) as (keyof T)[]).every(
    (key) => JSON.stringify(current[key]) === JSON.stringify(updates[key]),
  );

export const recordHistory = (state: History & Collections, coalesceKey?: string): HistoryPatch => {
  if (state.batchDepth > 0) {
    if (!state.pendingBatchSnapshot) return {};
    return {
      past: appendSnapshot(state.past, state.pendingBatchSnapshot),
      future: [],
      pendingBatchSnapshot: null,
      ...COALESCE_RESET,
    };
  }

  const now = Date.now();
  const isContinuation =
    !!coalesceKey &&
    state.lastCoalesceKey === coalesceKey &&
    now - state.lastCoalesceAt < HISTORY_COALESCE_MS;

  if (isContinuation) return { future: [], lastCoalesceAt: now };

  return {
    past: appendSnapshot(state.past, snapshot(state)),
    future: [],
    lastCoalesceKey: coalesceKey ?? null,
    lastCoalesceAt: coalesceKey ? now : 0,
  };
};

export const forgetHistory = (batchDepth: number, adopted: Collections): HistoryPatch => ({
  past: [],
  future: [],
  pendingBatchSnapshot: batchDepth > 0 ? snapshot(adopted) : null,
  ...COALESCE_RESET,
});
