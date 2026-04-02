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

interface EditorState {
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  furniture: PlacedFurniture[];
  rooms: Room[];

  activeTool: EditorTool;
  selectedElementId: string | null;
  isDrawing: boolean;

  zoom: number;
  panX: number;
  panY: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;

  currentWallStart: Point | null;

  past: HistorySnapshot[];
  future: HistorySnapshot[];

  setTool: (tool: EditorTool) => void;
  setSelectedElement: (id: string | null) => void;
  clearSelection: () => void;

  addWall: (wall: Wall) => void;
  removeWall: (id: string) => void;
  updateWall: (id: string, updates: Partial<Wall>) => void;

  addDoor: (door: Door) => void;
  removeDoor: (id: string) => void;
  updateDoor: (id: string, updates: Partial<Door>) => void;

  addWindow: (window: Window) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;

  addFurniture: (item: PlacedFurniture) => void;
  removeFurniture: (id: string) => void;
  updateFurniture: (id: string, updates: Partial<PlacedFurniture>) => void;

  setRooms: (rooms: Room[]) => void;

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

const MAX_HISTORY = 50;

export const useEditorStore = create<EditorState>()((set, get) => ({
  walls: [],
  doors: [],
  windows: [],
  furniture: [],
  rooms: [],

  activeTool: "select",
  selectedElementId: null,
  isDrawing: false,

  zoom: 1,
  panX: 0,
  panY: 0,
  gridSize: 20,
  showGrid: true,
  snapToGrid: true,

  currentWallStart: null,

  past: [],
  future: [],

  setTool: (tool) =>
    set({
      activeTool: tool,
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
    }),

  setSelectedElement: (id) => set({ selectedElementId: id }),

  clearSelection: () => set({ selectedElementId: null }),

  addWall: (wall) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      walls: [...state.walls, wall],
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  removeWall: (id) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      walls: state.walls.filter((w) => w.id !== id),
      doors: state.doors.filter((d) => d.wallId !== id),
      windows: state.windows.filter((w) => w.wallId !== id),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateWall: (id, updates) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      walls: state.walls.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  addDoor: (door) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      doors: [...state.doors, door],
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  removeDoor: (id) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      doors: state.doors.filter((d) => d.id !== id),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateDoor: (id, updates) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      doors: state.doors.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  addWindow: (window) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      windows: [...state.windows, window],
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  removeWindow: (id) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      windows: state.windows.filter((w) => w.id !== id),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateWindow: (id, updates) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  addFurniture: (item) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      furniture: [...state.furniture, item],
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  removeFurniture: (id) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      furniture: state.furniture.filter((f) => f.id !== id),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
      selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
    });
  },

  updateFurniture: (id, updates) => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  setRooms: (rooms) => set({ rooms }),

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
      past: [...state.past, currentSnapshot],
      future: state.future.slice(1),
      selectedElementId: null,
    });
  },

  pushHistory: () => {
    const state = get();
    const snapshot = createSnapshot(state);
    set({
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
    });
  },

  loadDesign: (design) => {
    const canvasData = design.canvasData;
    set({
      walls: canvasData.walls || [],
      doors: canvasData.doors || [],
      windows: canvasData.windows || [],
      furniture: (design.furniture?.length ? design.furniture : canvasData.furniture) || [],
      rooms: (design.rooms?.length ? design.rooms : canvasData.rooms) || [],
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
    const snapshot = createSnapshot(state);
    set({
      walls: [],
      doors: [],
      windows: [],
      furniture: [],
      rooms: [],
      selectedElementId: null,
      isDrawing: false,
      currentWallStart: null,
      past: [...state.past.slice(-MAX_HISTORY + 1), snapshot],
      future: [],
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
