import { create } from "zustand";
import type {
  Canvas,
  CatalogItem,
  Design,
  EditorTool,
  Furniture,
  Opening,
  Point,
  Room,
  Wall,
} from "@/types";
import { GRID_MM } from "@/lib/constants";
import { emptyCanvas } from "@/lib/canvas";

type Collections = Pick<Canvas, "walls" | "openings" | "rooms" | "furniture">;

// Edits sharing a coalesce key inside this window collapse into one undo step.
const HISTORY_COALESCE_MS = 700;

const MAX_HISTORY = 50;

interface EditorState extends Collections {
  catalog: CatalogItem[];

  activeTool: EditorTool;
  selectedElementId: string | null;
  isDrawing: boolean;
  canEdit: boolean;

  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;

  currentWallStart: Point | null;

  past: Collections[];
  future: Collections[];
  batchDepth: number;
  pendingBatchSnapshot: Collections | null;
  lastCoalesceKey: string | null;
  lastCoalesceAt: number;

  setTool: (tool: EditorTool) => void;
  setSelectedElement: (id: string | null) => void;
  clearSelection: () => void;
  setCanEdit: (canEdit: boolean) => void;
  setCatalog: (catalog: CatalogItem[]) => void;

  addWall: (wall: Wall) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<Wall>, coalesceKey?: string) => void;

  addOpening: (opening: Opening) => void;
  removeOpening: (id: string) => void;
  updateOpening: (id: string, updates: Partial<Opening>, coalesceKey?: string) => void;

  addFurniture: (piece: Furniture) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<Furniture>, coalesceKey?: string) => void;

  setRooms: (rooms: Room[], options?: { recordHistory?: boolean }) => void;
  removeElement: (id: string) => void;
  setCanvas: (canvas: Collections) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setGridSize: (size: number) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  setIsDrawing: (drawing: boolean) => void;
  setCurrentWallStart: (point: Point | null) => void;

  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  beginBatch: () => void;
  endBatch: () => void;

  loadDesign: (design: Design) => void;
  getCanvas: () => Canvas;
  clearCanvas: () => void;

  snapPoint: (point: Point) => Point;
}

const snapshot = (state: Collections): Collections => ({
  walls: structuredClone(state.walls),
  openings: structuredClone(state.openings),
  rooms: structuredClone(state.rooms),
  furniture: structuredClone(state.furniture),
});

type HistoryPatch = Partial<
  Pick<
    EditorState,
    "past" | "future" | "pendingBatchSnapshot" | "lastCoalesceKey" | "lastCoalesceAt"
  >
>;

const appendSnapshot = (past: Collections[], entry: Collections): Collections[] => [
  ...past.slice(-MAX_HISTORY + 1),
  entry,
];

const recordHistory = (state: EditorState, coalesceKey?: string): HistoryPatch => {
  if (state.batchDepth > 0) {
    if (state.pendingBatchSnapshot) {
      return {
        past: appendSnapshot(state.past, state.pendingBatchSnapshot),
        future: [],
        pendingBatchSnapshot: null,
        lastCoalesceKey: null,
        lastCoalesceAt: 0,
      };
    }
    return {};
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

const withoutSelection = (state: EditorState, id: string) =>
  state.selectedElementId === id ? null : state.selectedElementId;

export const useEditorStore = create<EditorState>()((set, get) => ({
  ...emptyCanvas(),
  catalog: [],

  activeTool: "select",
  selectedElementId: null,
  isDrawing: false,
  canEdit: true,

  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: GRID_MM,
  showGrid: true,
  snapToGrid: true,

  currentWallStart: null,

  past: [],
  future: [],
  batchDepth: 0,
  pendingBatchSnapshot: null,
  lastCoalesceKey: null,
  lastCoalesceAt: 0,

  setTool: (tool) =>
    set({ activeTool: tool, selectedElementId: null, isDrawing: false, currentWallStart: null }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  clearSelection: () => set({ selectedElementId: null }),
  setCanEdit: (canEdit) => set({ canEdit }),
  setCatalog: (catalog) => set({ catalog }),

  addWall: (wall) => {
    const state = get();
    set({ ...recordHistory(state), walls: [...state.walls, wall] });
  },

  removeWall: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: state.walls.filter((w) => w.id !== id),
      openings: state.openings.filter((o) => o.wall !== id),
      selectedElementId: withoutSelection(state, id),
    });
  },

  updateWall: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    });
  },

  addOpening: (opening) => {
    const state = get();
    set({ ...recordHistory(state), openings: [...state.openings, opening] });
  },

  removeOpening: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      openings: state.openings.filter((o) => o.id !== id),
      selectedElementId: withoutSelection(state, id),
    });
  },

  updateOpening: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      openings: state.openings.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    });
  },

  addFurniture: (piece) => {
    const state = get();
    set({ ...recordHistory(state), furniture: [...state.furniture, piece] });
  },

  removeFurniture: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      furniture: state.furniture.filter((f) => f.id !== id),
      selectedElementId: withoutSelection(state, id),
    });
  },

  updateFurniture: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  },

  setRooms: (rooms, options) => {
    if (!options?.recordHistory) {
      set({ rooms });
      return;
    }
    set({ ...recordHistory(get()), rooms });
  },

  removeElement: (id) => {
    const state = get();
    if (state.walls.some((w) => w.id === id)) return state.removeWall(id);
    if (state.openings.some((o) => o.id === id)) return state.removeOpening(id);
    if (state.furniture.some((f) => f.id === id)) return state.removeFurniture(id);
    if (state.rooms.some((r) => r.id === id)) {
      set({
        ...recordHistory(state),
        rooms: state.rooms.filter((r) => r.id !== id),
        selectedElementId: withoutSelection(state, id),
      });
    }
  },

  setCanvas: (canvas) => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: canvas.walls,
      openings: canvas.openings,
      rooms: canvas.rooms,
      furniture: canvas.furniture,
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setGridSize: (size) => set({ gridSize: Math.max(50, Math.min(1000, size)) }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setCurrentWallStart: (point) => set({ currentWallStart: point }),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    const previous = state.past[state.past.length - 1];
    set({
      ...previous,
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future.slice(0, MAX_HISTORY - 1)],
      selectedElementId: null,
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    const next = state.future[0];
    set({
      ...next,
      past: appendSnapshot(state.past, snapshot(state)),
      future: state.future.slice(1),
      selectedElementId: null,
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    });
  },

  pushHistory: () => set(recordHistory(get())),

  beginBatch: () => {
    const state = get();
    set({
      batchDepth: state.batchDepth + 1,
      pendingBatchSnapshot: state.batchDepth === 0 ? snapshot(state) : state.pendingBatchSnapshot,
    });
  },

  endBatch: () => {
    const state = get();
    const batchDepth = Math.max(0, state.batchDepth - 1);
    set({ batchDepth, pendingBatchSnapshot: batchDepth === 0 ? null : state.pendingBatchSnapshot });
  },

  loadDesign: (design) => {
    const canvas = { ...emptyCanvas(), ...(design.canvasData ?? {}) };
    set({
      walls: canvas.walls ?? [],
      openings: canvas.openings ?? [],
      rooms: canvas.rooms ?? [],
      furniture: canvas.furniture ?? [],
      activeTool: "select",
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
      past: [],
      future: [],
      batchDepth: 0,
      pendingBatchSnapshot: null,
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    });
  },

  getCanvas: () => {
    const { walls, openings, rooms, furniture } = get();
    return { ...emptyCanvas(), walls, openings, rooms, furniture };
  },

  clearCanvas: () => {
    const state = get();
    set({
      ...recordHistory(state),
      ...emptyCanvas(),
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    });
  },

  snapPoint: (point) => {
    const state = get();
    if (!state.snapToGrid) return { x: Math.round(point.x), y: Math.round(point.y) };
    const g = state.gridSize;
    return { x: Math.round(point.x / g) * g, y: Math.round(point.y / g) * g };
  },
}));
