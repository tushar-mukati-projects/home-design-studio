import { create } from "zustand";
import {
  clampOpeningOffset,
  constrainAngle,
  snapToEndpoints,
  wallAngle,
  type View,
} from "@/lib/canvas";
import {
  GRID_MM,
  MIN_WALL_LENGTH_MM,
  PX_PER_MM,
  SNAP_THRESHOLD_PX,
  clampZoom,
} from "@/lib/constants";
import {
  emptyCanvas,
  wallLength,
  type CatalogItem,
  type Furniture,
  type Opening,
  type Room,
  type Vec2,
  type Wall,
} from "@/shared/canvas";
import type { Design, EditorTool, Point } from "@/types";
import {
  COALESCE_RESET,
  HISTORY_RESET,
  appendSnapshot,
  forgetHistory,
  recordHistory,
  sameFields,
  snapshot,
  type Collections,
  type History,
} from "./editor-history";

type SnapOptions = {
  shift?: boolean;
  ignoreWallId?: string;
};

type SnappedPoint = {
  point: Point;
  joined: Vec2 | null;
};

type EditorState = Collections &
  History & {
    catalog: CatalogItem[];

    activeTool: EditorTool;
    selectedElementId: string | null;
    isDrawing: boolean;
    canEdit: boolean;
    openModals: number;

    zoom: number;
    panX: number;
    panY: number;
    showGrid: boolean;
    snapToGrid: boolean;

    currentWallStart: Point | null;

    setTool: (tool: EditorTool) => void;
    setSelectedElement: (id: string | null) => void;
    clearSelection: () => void;
    setCanEdit: (canEdit: boolean) => void;
    setModalOpen: (open: boolean) => void;
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

    setRooms: (rooms: Room[]) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    removeElement: (id: string) => void;
    nudgeSelected: (dx: number, dy: number) => void;
    setCanvas: (canvas: Collections) => void;
    replaceCollections: (collections: Partial<Collections>) => void;

    setZoom: (zoom: number) => void;
    setView: (view: View) => void;
    toggleGrid: () => void;
    toggleSnap: () => void;

    setIsDrawing: (drawing: boolean) => void;
    setCurrentWallStart: (point: Point | null) => void;
    stopDrawing: () => void;

    undo: () => void;
    redo: () => void;
    beginBatch: () => void;
    endBatch: () => void;

    loadDesign: (design: Design) => void;
    clearCanvas: () => void;

    snapPoint: (point: Point) => Point;
    snapWallPoint: (point: Point, options?: SnapOptions) => SnappedPoint;
  };

const IDLE = { selectedElementId: null, isDrawing: false, currentWallStart: null } as const;

export const useEditorStore = create<EditorState>()((set, get) => ({
  ...emptyCanvas(),
  ...HISTORY_RESET,
  ...IDLE,
  catalog: [],

  activeTool: "select",
  canEdit: true,
  openModals: 0,

  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  snapToGrid: true,

  setTool: (tool) => set({ ...IDLE, activeTool: tool }),
  setSelectedElement: (id) => set({ selectedElementId: id }),
  clearSelection: () => set({ selectedElementId: null }),
  setCanEdit: (canEdit) => set({ canEdit }),
  setModalOpen: (open) =>
    set((state) => ({ openModals: Math.max(0, state.openModals + (open ? 1 : -1)) })),
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
    });
  },

  updateWall: (id, updates, coalesceKey) => {
    const state = get();
    const wall = state.walls.find((w) => w.id === id);
    if (!wall || sameFields(wall, updates)) return;
    const next = { ...wall, ...updates };
    const moved = updates.from !== undefined || updates.to !== undefined;
    if (moved && wallLength(next) < MIN_WALL_LENGTH_MM) return;
    set({
      ...recordHistory(state, coalesceKey),
      walls: state.walls.map((w) => (w.id === id ? next : w)),
      openings: moved
        ? state.openings.map((o) => (o.wall === id ? reclamp(o, next) : o))
        : state.openings,
    });
  },

  addOpening: (opening) => {
    const state = get();
    set({ ...recordHistory(state), openings: [...state.openings, opening] });
  },

  removeOpening: (id) => {
    const state = get();
    set({ ...recordHistory(state), openings: state.openings.filter((o) => o.id !== id) });
  },

  updateOpening: (id, updates, coalesceKey) => {
    const state = get();
    const opening = state.openings.find((o) => o.id === id);
    if (!opening || sameFields(opening, updates)) return;
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
    set({ ...recordHistory(state), furniture: state.furniture.filter((f) => f.id !== id) });
  },

  updateFurniture: (id, updates, coalesceKey) => {
    const state = get();
    const piece = state.furniture.find((f) => f.id === id);
    if (!piece || sameFields(piece, updates)) return;
    set({
      ...recordHistory(state, coalesceKey),
      furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  },

  setRooms: (rooms) => set({ ...recordHistory(get()), rooms }),

  updateRoom: (id, updates) => {
    const state = get();
    const room = state.rooms.find((r) => r.id === id);
    if (!room || sameFields(room, updates)) return;
    set({
      ...recordHistory(state),
      rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    });
  },

  removeElement: (id) => {
    const state = get();
    if (state.walls.some((w) => w.id === id)) return state.removeWall(id);
    if (state.openings.some((o) => o.id === id)) return state.removeOpening(id);
    if (state.furniture.some((f) => f.id === id)) return state.removeFurniture(id);
    if (state.rooms.some((r) => r.id === id)) {
      set({ ...recordHistory(state), rooms: state.rooms.filter((r) => r.id !== id) });
    }
  },

  nudgeSelected: (dx, dy) => {
    const state = get();
    const id = state.selectedElementId;
    if (!id) return;
    const move = (p: Vec2): Vec2 => [p[0] + dx, p[1] + dy];
    const key = `nudge:${id}`;
    const wall = state.walls.find((w) => w.id === id);
    if (wall) return state.updateWall(id, { from: move(wall.from), to: move(wall.to) }, key);
    const piece = state.furniture.find((f) => f.id === id);
    if (piece) return state.updateFurniture(id, { at: move(piece.at) }, key);
    const opening = state.openings.find((o) => o.id === id);
    const onWall = opening && state.walls.find((w) => w.id === opening.wall);
    if (opening && onWall) {
      const angle = wallAngle(onWall);
      const along = dx * Math.cos(angle) + dy * Math.sin(angle);
      const offset = clampOpeningOffset(opening, onWall, opening.offset + along);
      return state.updateOpening(id, { offset }, key);
    }
    if (state.rooms.some((r) => r.id === id)) {
      set({
        ...recordHistory(state, key),
        rooms: state.rooms.map((r) => (r.id === id ? { ...r, polygon: r.polygon.map(move) } : r)),
      });
    }
  },

  setCanvas: (canvas) => set({ ...recordHistory(get()), ...snapshot(canvas), ...IDLE }),

  replaceCollections: (collections) => {
    const state = get();
    set({ ...collections, ...forgetHistory(state.batchDepth, { ...state, ...collections }) });
  },

  setZoom: (zoom) => set({ zoom: clampZoom(zoom) }),
  setView: ({ zoom, panX, panY }) => set({ zoom: clampZoom(zoom), panX, panY }),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleSnap: () => set((state) => ({ snapToGrid: !state.snapToGrid })),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),
  setCurrentWallStart: (point) => set({ currentWallStart: point }),
  stopDrawing: () => set({ isDrawing: false, currentWallStart: null }),

  undo: () => {
    const state = get();
    if (state.past.length === 0) return;
    set({
      ...state.past[state.past.length - 1],
      past: state.past.slice(0, -1),
      future: [snapshot(state), ...state.future],
      selectedElementId: null,
      ...COALESCE_RESET,
    });
  },

  redo: () => {
    const state = get();
    if (state.future.length === 0) return;
    set({
      ...state.future[0],
      past: appendSnapshot(state.past, snapshot(state)),
      future: state.future.slice(1),
      selectedElementId: null,
      ...COALESCE_RESET,
    });
  },

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

  loadDesign: (design) =>
    set({ ...snapshot(design.canvasData), ...HISTORY_RESET, ...IDLE, activeTool: "select" }),

  clearCanvas: () => set({ ...recordHistory(get()), ...snapshot(emptyCanvas()), ...IDLE }),

  snapPoint: (point) => {
    if (!get().snapToGrid) return { x: Math.round(point.x), y: Math.round(point.y) };
    return {
      x: Math.round(point.x / GRID_MM) * GRID_MM,
      y: Math.round(point.y / GRID_MM) * GRID_MM,
    };
  },

  snapWallPoint: (point, options = {}) => {
    const state = get();
    const joined = snapToEndpoints(
      point,
      state.walls,
      SNAP_THRESHOLD_PX / (state.zoom * PX_PER_MM),
      options.ignoreWallId,
    );
    if (joined) return { point: { x: joined[0], y: joined[1] }, joined };
    if (options.shift && state.currentWallStart) {
      const step = state.snapToGrid ? GRID_MM : 1;
      return { point: constrainAngle(state.currentWallStart, point, step), joined: null };
    }
    return { point: state.snapPoint(point), joined: null };
  },
}));

useEditorStore.subscribe((state, prev) => {
  const id = state.selectedElementId;
  if (!id || (!collectionsChanged(state, prev) && id === prev.selectedElementId)) return;
  if (!hasElement(state, id)) useEditorStore.setState({ selectedElementId: null });
});

const reclamp = (opening: Opening, wall: Wall): Opening => {
  const offset = clampOpeningOffset(opening, wall, opening.offset);
  return offset === opening.offset ? opening : { ...opening, offset };
};

const collectionsChanged = (state: Collections, prev: Collections) =>
  state.walls !== prev.walls ||
  state.openings !== prev.openings ||
  state.rooms !== prev.rooms ||
  state.furniture !== prev.furniture;

const hasElement = (state: Collections, id: string) =>
  state.walls.some((w) => w.id === id) ||
  state.openings.some((o) => o.id === id) ||
  state.rooms.some((r) => r.id === id) ||
  state.furniture.some((f) => f.id === id);
