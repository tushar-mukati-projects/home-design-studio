import { create } from "zustand";
import type {
  Wall,
  Door,
  Window,
  Room,
  PlacedFurniture,
  EditorTool,
  Point,
  CanvasData,
  Design,
} from "@/types";

interface HistorySnapshot {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: PlacedFurniture[];
  rooms: Room[];
}

// Edits sharing a coalesce key inside this window collapse into one undo step.
const HISTORY_COALESCE_MS = 700;

const MAX_HISTORY = 50;

interface EditorState {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: PlacedFurniture[];
  rooms: Room[];

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

  past: HistorySnapshot[];
  future: HistorySnapshot[];

  batchDepth: number;
  pendingBatchSnapshot: HistorySnapshot | null;
  lastCoalesceKey: string | null;
  lastCoalesceAt: number;

  setTool: (tool: EditorTool) => void;
  setSelectedElement: (id: string | null) => void;
  clearSelection: () => void;
  setCanEdit: (canEdit: boolean) => void;

  addWall: (wall: Wall) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<Wall>, coalesceKey?: string) => void;

  addDoor: (door: Door) => void;
  removeDoor: (id: string) => void;
  updateDoor: (id: string, updates: Partial<Door>, coalesceKey?: string) => void;

  addWindow: (window: Window) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<Window>, coalesceKey?: string) => void;

  addFurniture: (item: PlacedFurniture) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<PlacedFurniture>, coalesceKey?: string) => void;

  setRooms: (rooms: Room[], options?: { recordHistory?: boolean }) => void;
  setCanvas: (state: {
    walls: Wall[];
    rooms: Room[];
    furniture: PlacedFurniture[];
    doors: Door[];
    windows: Window[];
  }) => void;

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
  getCanvasData: () => CanvasData;
  clearCanvas: () => void;

  snapPoint: (point: Point) => Point;
}

const createSnapshot = (state: EditorState): HistorySnapshot => {
  return {
    walls: structuredClone(state.walls),
    doors: structuredClone(state.doors),
    windows: structuredClone(state.windows),
    furniture: structuredClone(state.furniture),
    rooms: structuredClone(state.rooms),
  };
};

type HistoryPatch = Partial<
  Pick<
    EditorState,
    "past" | "future" | "pendingBatchSnapshot" | "lastCoalesceKey" | "lastCoalesceAt"
  >
>;

const appendSnapshot = (past: HistorySnapshot[], snapshot: HistorySnapshot): HistorySnapshot[] => [
  ...past.slice(-MAX_HISTORY + 1),
  snapshot,
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

  if (isContinuation) {
    return { future: [], lastCoalesceAt: now };
  }

  return {
    past: appendSnapshot(state.past, createSnapshot(state)),
    future: [],
    lastCoalesceKey: coalesceKey ?? null,
    lastCoalesceAt: coalesceKey ? now : 0,
  };
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  walls: [],
  doors: [],
  windows: [],
  furniture: [],
  rooms: [],

  activeTool: "select",
  selectedElementId: null,
  isDrawing: false,
  canEdit: true,

  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 20,
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
    set({
      activeTool: tool,
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    }),

  setSelectedElement: (id) => set({ selectedElementId: id }),

  clearSelection: () => set({ selectedElementId: null }),

  setCanEdit: (canEdit) => set({ canEdit }),

  addWall: (wall) => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: [...state.walls, wall],
    });
  },

  removeWall: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: state.walls.filter((w) => w.id !== id),
      doors: state.doors.filter((d) => d.wallId !== id),
      windows: state.windows.filter((w) => w.wallId !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateWall: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    });
  },

  addDoor: (door) => {
    const state = get();
    set({
      ...recordHistory(state),
      doors: [...state.doors, door],
    });
  },

  removeDoor: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      doors: state.doors.filter((d) => d.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateDoor: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    });
  },

  addWindow: (window) => {
    const state = get();
    set({
      ...recordHistory(state),
      windows: [...state.windows, window],
    });
  },

  removeWindow: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      windows: state.windows.filter((w) => w.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateWindow: (id, updates, coalesceKey) => {
    const state = get();
    set({
      ...recordHistory(state, coalesceKey),
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    });
  },

  addFurniture: (item) => {
    const state = get();
    set({
      ...recordHistory(state),
      furniture: [...state.furniture, item],
    });
  },

  removeFurniture: (id) => {
    const state = get();
    set({
      ...recordHistory(state),
      furniture: state.furniture.filter((f) => f.id !== id),
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
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
    const state = get();
    set({ ...recordHistory(state), rooms });
  },

  setCanvas: (newState) => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: newState.walls,
      rooms: newState.rooms,
      furniture: newState.furniture,
      doors: newState.doors,
      windows: newState.windows,
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  setGridSize: (size) => set({ gridSize: Math.max(5, Math.min(100, size)) }),

  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),

  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  setCurrentWallStart: (point) => set({ currentWallStart: point }),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;

    const currentSnapshot = createSnapshot(state);
    const previousSnapshot = state.past[state.past.length - 1];

    set({
      walls: previousSnapshot.walls,
      doors: previousSnapshot.doors,
      windows: previousSnapshot.windows,
      furniture: previousSnapshot.furniture,
      rooms: previousSnapshot.rooms,
      past: state.past.slice(0, -1),
      future: [currentSnapshot, ...state.future.slice(0, MAX_HISTORY - 1)],
      selectedElementId: null,
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;

    const currentSnapshot = createSnapshot(state);
    const nextSnapshot = state.future[0];

    set({
      walls: nextSnapshot.walls,
      doors: nextSnapshot.doors,
      windows: nextSnapshot.windows,
      furniture: nextSnapshot.furniture,
      rooms: nextSnapshot.rooms,
      past: appendSnapshot(state.past, currentSnapshot),
      future: state.future.slice(1),
      selectedElementId: null,
      lastCoalesceKey: null,
      lastCoalesceAt: 0,
    });
  },

  pushHistory: () => {
    const state = get();
    set(recordHistory(state));
  },

  beginBatch: () => {
    const state = get();
    set({
      batchDepth: state.batchDepth + 1,
      pendingBatchSnapshot:
        state.batchDepth === 0 ? createSnapshot(state) : state.pendingBatchSnapshot,
    });
  },

  endBatch: () => {
    const state = get();
    const batchDepth = Math.max(0, state.batchDepth - 1);
    set({
      batchDepth,
      pendingBatchSnapshot: batchDepth === 0 ? null : state.pendingBatchSnapshot,
    });
  },

  loadDesign: (design) => {
    const canvasData = design.canvasData;
    set({
      walls: canvasData.walls || [],
      doors: canvasData.doors || [],
      windows: canvasData.windows || [],
      furniture: canvasData.furniture || [],
      rooms: canvasData.rooms || [],
      gridSize: canvasData.gridSize || 20,
      zoom: canvasData.zoom || 1,
      panX: canvasData.panX || 0,
      panY: canvasData.panY || 0,
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

  getCanvasData: () => {
    const state = get();
    return {
      walls: state.walls,
      doors: state.doors,
      windows: state.windows,
      rooms: state.rooms,
      furniture: state.furniture,
      gridSize: state.gridSize,
      zoom: state.zoom,
      panX: state.panX,
      panY: state.panY,
    };
  },

  clearCanvas: () => {
    const state = get();
    set({
      ...recordHistory(state),
      walls: [],
      doors: [],
      windows: [],
      furniture: [],
      rooms: [],
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    });
  },

  snapPoint: (point) => {
    const state = get();
    if (!state.snapToGrid) return point;
    const gs = state.gridSize;
    return {
      x: Math.round(point.x / gs) * gs,
      y: Math.round(point.y / gs) * gs,
    };
  },
}));
