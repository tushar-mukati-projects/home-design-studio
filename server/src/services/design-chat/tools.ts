import { randomUUID } from "crypto";
import {
  DEFAULTS,
  emptyCanvas,
  newOpening,
  newWall,
  type Canvas,
  type CatalogItem,
  type Furniture,
  type Opening,
  type Room,
  type Wall,
} from "../../shared/canvas";
import type { EditCanvasInput, SetCanvasInput } from "./tool-input";

export type ChatSession = {
  canvas: Canvas;
  catalog: CatalogItem[];
  loaded: boolean;
  dirty: boolean;
};

export type ToolResult = { summary: string; action?: { actionType: string; payload: object } };

type Identified = { id: string };
type RoomInput = SetCanvasInput["rooms"][number];
type EditOperation = EditCanvasInput["operation"];
type Edit = (session: ChatSession, input: EditCanvasInput) => ToolResult;

export const newSession = (): ChatSession => ({
  canvas: emptyCanvas(),
  catalog: [],
  loaded: false,
  dirty: false,
});

export const setCanvas = (session: ChatSession, input: SetCanvasInput): ToolResult => {
  if (!session.loaded) return { summary: "Call fetch_canvas first to load the catalog." };

  const unknown = input.furniture.map((f) => f.item).filter((id) => !itemById(session, id));
  if (unknown.length > 0) {
    return { summary: `Unknown furniture ids: ${unknown.join(", ")}. Use ids from fetch_canvas.` };
  }

  const walls: Wall[] = input.walls.map((w) => wallFrom(w.from, w.to, w.thickness));
  const rooms: Room[] = input.rooms.map(newRoom);
  const furniture: Furniture[] = input.furniture.map((f) => ({
    id: randomUUID(),
    item: f.item,
    at: f.at,
    rotation: f.rotation ?? 0,
  }));
  const openings: Opening[] = input.openings.flatMap((o) => {
    const wall = walls[o.wallIndex];
    return wall ? [openingOn(o.kind, wall, o.offset, o.width, o.variant)] : [];
  });

  session.canvas = { ...emptyCanvas(), walls, openings, rooms, furniture };
  session.dirty = true;
  return {
    summary: `Canvas set: ${walls.length} walls, ${rooms.length} rooms, ${furniture.length} furniture, ${openings.length} openings.`,
    action: { actionType: "set_canvas", payload: session.canvas },
  };
};

const itemById = (session: ChatSession, id: string) => session.catalog.find((c) => c.id === id);

const wallFrom = (from: Wall["from"], to: Wall["to"], thickness: number | undefined): Wall => ({
  ...newWall(from, to),
  thickness: thickness ?? DEFAULTS.wallThickness,
});

const newRoom = ({ name, usage, x, y, width, height }: RoomInput): Room => ({
  id: randomUUID(),
  name,
  usage,
  polygon: [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ],
});

const openingOn = (
  kind: Opening["kind"],
  wall: Wall,
  offset: number,
  width: number | undefined,
  variant: Opening["variant"],
): Opening => {
  const opening = newOpening(kind, wall.id, offset);
  return {
    ...opening,
    width: width ?? opening.width,
    ...(kind === "door" && variant ? { variant } : {}),
  };
};

const addWall: Edit = (session, { from, to, thickness }) => {
  if (!from || !to) return { summary: "add_wall requires from and to" };
  const wall = wallFrom(from, to, thickness);
  session.canvas.walls.push(wall);
  session.dirty = true;
  return {
    summary: `Wall added (${wall.from}) → (${wall.to}). Total walls: ${session.canvas.walls.length}`,
    action: { actionType: "add_wall", payload: wall },
  };
};

const addRoom: Edit = (session, { name, usage, x, y, width, height }) => {
  if (!name || !usage || x == null || y == null || width == null || height == null) {
    return { summary: "add_room requires name, usage, x, y, width, height" };
  }
  const room = newRoom({ name, usage, x, y, width, height });
  session.canvas.rooms.push(room);
  session.dirty = true;
  return {
    summary: `Room "${name}" (${usage}) added at (${x},${y}) size ${width}×${height} mm`,
    action: { actionType: "add_room", payload: room },
  };
};

const placeFurniture: Edit = (session, { item, at, rotation }) => {
  if (!item || !at) return { summary: "place_furniture requires item and at" };
  const entry = itemById(session, item);
  if (!entry) {
    return {
      summary: `Unknown item "${item}". Valid ids: ${session.catalog.map((c) => c.id).join(", ")}`,
    };
  }
  const placed: Furniture = { id: randomUUID(), item, at, rotation: rotation ?? 0 };
  session.canvas.furniture.push(placed);
  session.dirty = true;
  return {
    summary: `${entry.name} placed at (${at}) rotation=${rotation ?? 0}`,
    action: { actionType: "place_furniture", payload: placed },
  };
};

const addOpening: Edit = (session, { kind, wallIndex, offset, width, variant }) => {
  if (!kind || wallIndex == null || offset == null) {
    return { summary: "add_opening requires kind, wallIndex and offset" };
  }
  const wall = session.canvas.walls[wallIndex];
  if (!wall) {
    return {
      summary: `No wall at index ${wallIndex}. Valid: 0–${session.canvas.walls.length - 1}`,
    };
  }
  const opening = openingOn(kind, wall, offset, width, variant);
  session.canvas.openings.push(opening);
  session.dirty = true;
  return {
    summary: `${kind} added on wall [${wallIndex}] at ${offset} mm`,
    action: { actionType: "add_opening", payload: opening },
  };
};

const removeElement: Edit = (session, { collection, elementId }) => {
  if (!collection || !elementId) {
    return { summary: "remove_element requires collection and elementId" };
  }
  const list: Identified[] = session.canvas[collection];
  const index = list.findIndex((e) => e.id === elementId);
  if (index === -1) return { summary: `No ${collection} entry with id ${elementId}` };
  list.splice(index, 1);
  if (collection === "walls") {
    session.canvas.openings = session.canvas.openings.filter((o) => o.wall !== elementId);
  }
  session.dirty = true;
  return {
    summary: `Removed from ${collection}`,
    action: { actionType: "remove_element", payload: { collection, elementId } },
  };
};

const clearAll: Edit = (session) => {
  session.canvas = emptyCanvas();
  session.dirty = true;
  return { summary: "Canvas cleared.", action: { actionType: "clear_design", payload: {} } };
};

const EDITS = {
  add_wall: addWall,
  add_room: addRoom,
  place_furniture: placeFurniture,
  add_opening: addOpening,
  remove_element: removeElement,
  clear_all: clearAll,
} satisfies Record<EditOperation, Edit>;

export const editCanvas = (session: ChatSession, input: EditCanvasInput): ToolResult => {
  if (!session.loaded) return { summary: "Call fetch_canvas first before editing." };
  return EDITS[input.operation](session, input);
};
