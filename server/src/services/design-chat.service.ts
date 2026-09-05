import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { getDesignById, updateDesign } from "./design.service";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";

const ROOM_COLORS: Record<string, string> = {
  living_room: "#d4d4d8",
  bedroom: "#c8c8d0",
  kitchen: "#d8d8dc",
  bathroom: "#c0c8d0",
  dining: "#d0d0d4",
  office: "#ccc8c4",
  hallway: "#e0e0e4",
  closet: "#dcdce0",
  generic: "#d4d4d8",
};

const ROOM_TYPES = [
  "living_room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining",
  "office",
  "hallway",
  "closet",
  "generic",
] as const;

interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
  color?: string;
}
interface Room {
  id: string;
  name: string;
  type: string;
  color?: string;
  points: { x: number; y: number }[];
  area?: number;
}
interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
  depth?: number;
  color?: string;
}
interface PlacedFurniture {
  id: string;
  furnitureItemId: string;
  furnitureItem: FurnitureItem;
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}
interface Door {
  id: string;
  wallId: string;
  position: number;
  width?: number;
  type?: string;
}
interface Win {
  id: string;
  wallId: string;
  position: number;
  width?: number;
}

interface CanvasState {
  walls: Wall[];
  rooms: Room[];
  furniture: PlacedFurniture[];
  doors: Door[];
  windows: Win[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ToolResult = { summary: string; action?: { actionType: string; payload: object } };

export const designChatStream = async (
  designId: string,
  userId: string,
  email: string | undefined,
  messages: ChatMessage[],
  res: Response,
) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const canvasState: CanvasState = { walls: [], rooms: [], furniture: [], doors: [], windows: [] };
  let designFetched = false;

  let canvasDirty = false;
  let availableFurnitureItems: FurnitureItem[] = [];

  const tools = {
    fetch_canvas: tool({
      description:
        "Fetch the complete canvas state from the database — walls, rooms, placed furniture, doors, and windows — plus all available furniture items that can be placed. ALWAYS call this first before making any changes so you know the current state and valid furniture IDs.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        const [design, dbFurnitureItems] = await Promise.all([
          getDesignById(designId, { userId, email }),
          prisma.furnitureItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
        ]);

        if (!design) return { summary: "Design not found or access denied." };
        if (design.permission === "readonly") {
          return { summary: "You have view-only access to this design, so it cannot be changed." };
        }

        availableFurnitureItems = dbFurnitureItems;

        const cd = design.canvasData as Record<string, unknown>;
        canvasState.walls = (cd.walls as Wall[]) ?? [];
        canvasState.doors = (cd.doors as Door[]) ?? [];
        canvasState.windows = (cd.windows as Win[]) ?? [];
        canvasState.rooms = (cd.rooms as Room[]) ?? [];
        canvasState.furniture = (cd.furniture as PlacedFurniture[]) ?? [];
        designFetched = true;
        canvasDirty = false;

        const furnitureCatalog = dbFurnitureItems
          .map((f) => `${f.id} → ${f.name} (${f.width}×${f.height}px, ${f.category})`)
          .join("\n");

        if (
          canvasState.walls.length === 0 &&
          canvasState.rooms.length === 0 &&
          canvasState.furniture.length === 0
        ) {
          return {
            summary: [
              `Design "${design.name}" is empty (${design.width}×${design.height}px). Ready to build.`,
              `\nAvailable furniture IDs (use exact ID for place_furniture):\n${furnitureCatalog}`,
            ].join(""),
          };
        }

        return {
          summary: [
            `Design: "${design.name}" (${design.width}×${design.height}px)`,
            `Walls: ${canvasState.walls.length} (indexed 0–${canvasState.walls.length - 1})`,
            `Rooms: ${canvasState.rooms.length > 0 ? canvasState.rooms.map((r) => `"${r.name}" [${r.type}]`).join(", ") : "none"}`,
            `Furniture: ${canvasState.furniture.length > 0 ? canvasState.furniture.map((f) => f.furnitureItem?.name ?? f.furnitureItemId).join(", ") : "none"}`,
            `Doors: ${canvasState.doors.length}, Windows: ${canvasState.windows.length}`,
            `\nAvailable furniture IDs (use exact ID for place_furniture):\n${furnitureCatalog}`,
          ].join("\n"),
        };
      },
    }),

    set_canvas: tool({
      description: `Replace the ENTIRE canvas with a new complete layout in ONE atomic call. Use this for any new design, full redesign, multi-room layout, or "start over" request. Plan ALL rooms and furniture positions before calling — this replaces everything at once.`,
      inputSchema: z.object({
        walls: z
          .array(
            z.object({
              x1: z.number(),
              y1: z.number(),
              x2: z.number(),
              y2: z.number(),
              thickness: z.number().optional(),
            }),
          )
          .default([]),
        rooms: z
          .array(
            z.object({
              name: z.string(),
              type: z.enum(ROOM_TYPES),
              x: z.number(),
              y: z.number(),
              width: z.number(),
              height: z.number(),
            }),
          )
          .default([]),
        furniture: z
          .array(
            z.object({
              furnitureId: z
                .string()
                .describe("Exact UUID from fetch_canvas catalog — never invent"),
              x: z.number().describe("Top-left X of item"),
              y: z.number().describe("Top-left Y of item"),
              rotation: z.number().optional().describe("0, 90, 180, or 270"),
            }),
          )
          .default([]),
        doors: z
          .array(
            z.object({
              wallIndex: z.number().int().describe("0-based index into walls array above"),
              position: z.number().min(0).max(1).describe("0.0 = start, 1.0 = end of wall"),
              type: z.enum(["single", "double", "sliding"]).optional(),
            }),
          )
          .default([]),
        windows: z
          .array(
            z.object({
              wallIndex: z.number().int(),
              position: z.number().min(0).max(1),
              width: z.number().optional(),
            }),
          )
          .default([]),
      }),
      execute: async (params): Promise<ToolResult> => {
        if (!designFetched) {
          return { summary: "Call fetch_canvas first to load the furniture catalog." };
        }

        const invalidIds: string[] = [];
        const placedFurniture: PlacedFurniture[] = [];

        for (const f of params.furniture) {
          const item = availableFurnitureItems.find((fi) => fi.id === f.furnitureId);
          if (!item) {
            invalidIds.push(f.furnitureId);
            continue;
          }
          placedFurniture.push({
            id: randomUUID(),
            furnitureItemId: item.id,
            furnitureItem: item,
            x: f.x,
            y: f.y,
            rotation: f.rotation ?? 0,
            scaleX: 1,
            scaleY: 1,
          });
        }

        if (invalidIds.length > 0) {
          return {
            summary: `Invalid furniture IDs: ${invalidIds.join(", ")}. Call fetch_canvas to get valid UUIDs.`,
          };
        }

        const newWalls: Wall[] = params.walls.map((w) => ({
          id: randomUUID(),
          x1: w.x1,
          y1: w.y1,
          x2: w.x2,
          y2: w.y2,
          thickness: w.thickness ?? 12,
          color: "#52525b",
        }));

        const newRooms: Room[] = params.rooms.map((r) => ({
          id: randomUUID(),
          name: r.name,
          type: r.type,
          color: ROOM_COLORS[r.type] ?? ROOM_COLORS.generic,
          points: [
            { x: r.x, y: r.y },
            { x: r.x + r.width, y: r.y },
            { x: r.x + r.width, y: r.y + r.height },
            { x: r.x, y: r.y + r.height },
          ],
          area: r.width * r.height,
        }));

        const newDoors: Door[] = params.doors
          .filter((d) => newWalls[d.wallIndex])
          .map((d) => ({
            id: randomUUID(),
            wallId: newWalls[d.wallIndex].id,
            position: d.position,
            width: 80,
            type: d.type ?? "single",
          }));

        const newWindows: Win[] = params.windows
          .filter((w) => newWalls[w.wallIndex])
          .map((w) => ({
            id: randomUUID(),
            wallId: newWalls[w.wallIndex].id,
            position: w.position,
            width: w.width ?? 100,
          }));

        canvasState.walls = newWalls;
        canvasState.rooms = newRooms;
        canvasState.furniture = placedFurniture;
        canvasState.doors = newDoors;
        canvasState.windows = newWindows;
        canvasDirty = true;

        return {
          summary: `Canvas set: ${newWalls.length} walls, ${newRooms.length} rooms, ${placedFurniture.length} furniture, ${newDoors.length} doors, ${newWindows.length} windows.`,
          action: {
            actionType: "set_canvas",
            payload: {
              walls: newWalls,
              rooms: newRooms,
              furniture: placedFurniture,
              doors: newDoors,
              windows: newWindows,
            },
          },
        };
      },
    }),

    edit_canvas: tool({
      description: `Apply a single targeted edit to an existing canvas. Use for small changes only (add/remove one element). For full redesigns or multi-element layouts, use set_canvas instead. Operations:
- add_wall: x1, y1, x2, y2 required; thickness optional (default 12)
- add_room: name, roomType, x, y, width, height required
- place_furniture: furnitureId (UUID from fetch_canvas catalog), x, y required; rotation optional (0/90/180/270)
- add_door: wallIndex (0-based index into walls array), position (0.0–1.0 along wall) required; doorType optional
- add_window: wallIndex, position required; width optional
- remove_element: elementType (wall|room|furniture|door|window), elementId required
- clear_all: removes everything`,
      inputSchema: z.object({
        operation: z.enum([
          "add_wall",
          "add_room",
          "place_furniture",
          "add_door",
          "add_window",
          "remove_element",
          "clear_all",
        ]),
        x1: z.number().optional(),
        y1: z.number().optional(),
        x2: z.number().optional(),
        y2: z.number().optional(),
        thickness: z.number().optional(),
        name: z.string().optional(),
        roomType: z.enum(ROOM_TYPES).optional(),
        x: z.number().optional(),
        y: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        furnitureId: z.string().optional(),
        rotation: z.number().optional(),
        wallIndex: z.number().int().optional(),
        position: z.number().min(0).max(1).optional(),
        doorType: z.enum(["single", "double", "sliding"]).optional(),
        elementType: z.enum(["wall", "room", "furniture", "door", "window"]).optional(),
        elementId: z.string().optional(),
      }),
      execute: async (params): Promise<ToolResult> => {
        if (!designFetched) {
          return { summary: "Call fetch_canvas first before editing." };
        }
        const { operation } = params;

        if (operation === "add_wall") {
          const { x1, y1, x2, y2, thickness } = params;
          if (x1 == null || y1 == null || x2 == null || y2 == null) {
            return { summary: "add_wall requires x1, y1, x2, y2" };
          }
          const wall: Wall = {
            id: randomUUID(),
            x1,
            y1,
            x2,
            y2,
            thickness: thickness ?? 12,
            color: "#52525b",
          };
          canvasState.walls.push(wall);
          canvasDirty = true;
          return {
            summary: `Wall added from (${x1},${y1}) to (${x2},${y2}). Total walls: ${canvasState.walls.length}`,
            action: { actionType: "add_wall", payload: wall },
          };
        }

        if (operation === "add_room") {
          const { name, roomType, x, y, width, height } = params;
          if (!name || !roomType || x == null || y == null || width == null || height == null) {
            return { summary: "add_room requires name, roomType, x, y, width, height" };
          }
          const room: Room = {
            id: randomUUID(),
            name,
            type: roomType,
            color: ROOM_COLORS[roomType] ?? ROOM_COLORS.generic,
            points: [
              { x, y },
              { x: x + width, y },
              { x: x + width, y: y + height },
              { x, y: y + height },
            ],
            area: width * height,
          };
          canvasState.rooms.push(room);
          canvasDirty = true;
          return {
            summary: `Room "${name}" (${roomType}) added at (${x},${y}) size ${width}×${height}px`,
            action: { actionType: "add_room", payload: room },
          };
        }

        if (operation === "place_furniture") {
          const { furnitureId, x, y, rotation } = params;
          if (!furnitureId || x == null || y == null) {
            return { summary: "place_furniture requires furnitureId, x, y" };
          }
          const item = availableFurnitureItems.find((f) => f.id === furnitureId);
          if (!item) {
            const validIds = availableFurnitureItems
              .slice(0, 10)
              .map((f) => `${f.id} (${f.name})`)
              .join(", ");
            return {
              summary: `Unknown furnitureId "${furnitureId}". Call fetch_canvas to get valid IDs. Sample: ${validIds}`,
            };
          }
          const placed: PlacedFurniture = {
            id: randomUUID(),
            furnitureItemId: item.id,
            furnitureItem: item,
            x,
            y,
            rotation: rotation ?? 0,
            scaleX: 1,
            scaleY: 1,
          };
          canvasState.furniture.push(placed);
          canvasDirty = true;
          return {
            summary: `${item.name} placed at (${x},${y}) rotation=${rotation ?? 0}`,
            action: { actionType: "place_furniture", payload: placed },
          };
        }

        if (operation === "add_door") {
          const { wallIndex, position, width, doorType } = params;
          if (wallIndex == null || position == null) {
            return { summary: "add_door requires wallIndex and position" };
          }
          const wall = canvasState.walls[wallIndex];
          if (!wall) {
            return {
              summary: `No wall at index ${wallIndex}. Available indices: 0–${canvasState.walls.length - 1}`,
            };
          }
          const door: Door = {
            id: randomUUID(),
            wallId: wall.id,
            position,
            width: width ?? 80,
            type: doorType ?? "single",
          };
          canvasState.doors.push(door);
          canvasDirty = true;
          return {
            summary: `${door.type} door added on wall [${wallIndex}] at position ${position}`,
            action: { actionType: "add_door", payload: door },
          };
        }

        if (operation === "add_window") {
          const { wallIndex, position, width } = params;
          if (wallIndex == null || position == null) {
            return { summary: "add_window requires wallIndex and position" };
          }
          const wall = canvasState.walls[wallIndex];
          if (!wall) {
            return {
              summary: `No wall at index ${wallIndex}. Available indices: 0–${canvasState.walls.length - 1}`,
            };
          }
          const win: Win = { id: randomUUID(), wallId: wall.id, position, width: width ?? 100 };
          canvasState.windows.push(win);
          canvasDirty = true;
          return {
            summary: `Window added on wall [${wallIndex}] at position ${position}`,
            action: { actionType: "add_window", payload: win },
          };
        }

        if (operation === "remove_element") {
          const { elementType, elementId } = params;
          if (!elementType || !elementId) {
            return { summary: "remove_element requires elementType and elementId" };
          }
          const removeFrom = (arr: { id: string }[], label: string) => {
            const idx = arr.findIndex((e) => e.id === elementId);
            if (idx === -1) return `No ${label} with id ${elementId}`;
            arr.splice(idx, 1);
            canvasDirty = true;
            return null;
          };
          let err: string | null = null;
          switch (elementType) {
            case "wall":
              err = removeFrom(canvasState.walls, "wall");
              if (!err) {
                canvasState.doors = canvasState.doors.filter((d) => d.wallId !== elementId);
                canvasState.windows = canvasState.windows.filter((w) => w.wallId !== elementId);
              }
              break;
            case "room":
              err = removeFrom(canvasState.rooms, "room");
              break;
            case "furniture":
              err = removeFrom(canvasState.furniture, "furniture");
              break;
            case "door":
              err = removeFrom(canvasState.doors, "door");
              break;
            case "window":
              err = removeFrom(canvasState.windows, "window");
              break;
          }
          if (err) return { summary: err };
          return {
            summary: `${elementType} removed`,
            action: { actionType: "remove_element", payload: { elementType, elementId } },
          };
        }

        if (operation === "clear_all") {
          canvasState.walls.length = 0;
          canvasState.rooms.length = 0;
          canvasState.furniture.length = 0;
          canvasState.doors.length = 0;
          canvasState.windows.length = 0;
          return {
            summary: "Canvas cleared.",
            action: { actionType: "clear_design", payload: {} },
          };
        }

        return { summary: `Unknown operation: ${operation}` };
      },
    }),

    review_canvas: tool({
      description:
        "Get a detailed snapshot of everything on the canvas — exact positions, sizes, IDs. Use this to verify placement or retrieve element IDs before removing something.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        const { walls, rooms, furniture, doors, windows } = canvasState;
        if (walls.length === 0 && rooms.length === 0 && furniture.length === 0) {
          return { summary: "Canvas is empty." };
        }
        const parts: string[] = [];
        if (walls.length > 0) {
          parts.push(
            `Walls (${walls.length}):\n` +
              walls
                .map(
                  (w, i) =>
                    `  [${i}] (${w.x1},${w.y1})→(${w.x2},${w.y2}) t=${w.thickness ?? 12} id=${w.id}`,
                )
                .join("\n"),
          );
        }
        if (rooms.length > 0) {
          parts.push(
            `Rooms (${rooms.length}):\n` +
              rooms.map((r) => `  "${r.name}" [${r.type}] area=${r.area} id=${r.id}`).join("\n"),
          );
        }
        if (furniture.length > 0) {
          parts.push(
            `Furniture (${furniture.length}):\n` +
              furniture
                .map(
                  (f) =>
                    `  ${f.furnitureItem?.name ?? f.furnitureItemId} at (${f.x},${f.y}) rot=${f.rotation ?? 0} id=${f.id}`,
                )
                .join("\n"),
          );
        }
        if (doors.length > 0) {
          parts.push(
            `Doors (${doors.length}): ${doors.map((d) => `${d.type ?? "single"} pos=${d.position} id=${d.id}`).join(", ")}`,
          );
        }
        if (windows.length > 0) {
          parts.push(
            `Windows (${windows.length}): ${windows.map((w) => `pos=${w.position} id=${w.id}`).join(", ")}`,
          );
        }
        return { summary: parts.join("\n") };
      },
    }),

    save_canvas: tool({
      description:
        "Persist all canvas changes to the database. Always call this after making edits — nothing is saved until you call this.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        if (!designFetched) {
          return { summary: "Call fetch_canvas first before saving." };
        }
        if (!canvasDirty) {
          return {
            summary:
              "Nothing to save — no changes were made this turn. Saving now would overwrite " +
              "edits other people may have made since the canvas was fetched.",
          };
        }
        try {
          const canvasData = {
            walls: canvasState.walls,
            doors: canvasState.doors,
            windows: canvasState.windows,
            rooms: canvasState.rooms.map((r) => ({
              ...r,
              color: r.color ?? ROOM_COLORS[r.type] ?? ROOM_COLORS.generic,
              area: r.area ?? 0,
            })),
            furniture: canvasState.furniture,
          };
          const saved = await updateDesign(designId, { canvasData }, userId, email);
          if (!saved) {
            return { summary: "Save failed: you do not have permission to edit this design." };
          }
          canvasDirty = false;

          return {
            summary: `Saved: ${canvasState.walls.length} walls, ${canvasState.rooms.length} rooms, ${canvasState.furniture.length} furniture items, ${canvasState.doors.length} doors, ${canvasState.windows.length} windows.`,
          };
        } catch (err) {
          logger.error("design-chat save_canvas failed", {
            designId,
            error: err instanceof Error ? err.message : String(err),
          });
          return {
            summary: "Failed to save — the change was not stored. Ask the user to try again.",
          };
        }
      },
    }),
  };

  const system = `You are a professional interior designer AI for a 2D floor plan editor. You create and modify floor plans using tools.

## COORDINATE SYSTEM
- Origin (0, 0) is top-left corner of the canvas.
- X increases rightward, Y increases downward.
- All units are in PIXELS. 30 pixels = 1 foot.
- Typical canvas: ~1200×900 px (40×30 ft). Use fetch_canvas to get exact size.
- Furniture (x, y) is the CENTER of the item, NOT its top-left corner.
  An item of size fw x fh at (x, y) spans x-fw/2 .. x+fw/2 and y-fh/2 .. y+fh/2.
- Furniture width/height from the catalog are in PIXELS.

## TOOLS
- fetch_canvas   → ALWAYS call first. Returns current state + furniture catalog with UUIDs.
- set_canvas     → Replace entire canvas atomically. Use for new designs or major rebuilds.
- edit_canvas    → Add/remove single elements. Use for small tweaks only.
- review_canvas  → Get exact positions/IDs. Use before removals.
- save_canvas    → Persist to DB. ALWAYS call last.

## WORKFLOW
New/full design:  fetch_canvas → set_canvas → save_canvas
Small change:     fetch_canvas → edit_canvas → save_canvas

## DESIGN RULES — READ CAREFULLY

### Room Layout
1. Use the FULL canvas area. Do NOT leave large empty margins. Start rooms near (40, 40).
2. Adjacent rooms SHARE walls — the right wall of room A is the left wall of room B.
3. Rooms should tile in a grid with NO gaps between them (except for the shared wall thickness of ~12px).
4. Standard room sizes (in pixels):
   - Living room:  350–500 wide × 300–450 tall
   - Bedroom:      300–400 wide × 280–380 tall
   - Kitchen:      250–350 wide × 250–350 tall
   - Bathroom:     180–250 wide × 200–280 tall
   - Office:       250–350 wide × 250–350 tall
   - Dining room:  300–400 wide × 280–350 tall
   - Hallway:      80–120 wide × full height (or full width × 80–120 tall)

### Wall Construction
For each room at position (rx, ry) with size (rw, rh), create 4 walls:
  Top:    (rx, ry) → (rx+rw, ry)
  Right:  (rx+rw, ry) → (rx+rw, ry+rh)
  Bottom: (rx+rw, ry+rh) → (rx, ry+rh)
  Left:   (rx, ry+rh) → (rx, ry)
When two rooms share a boundary, they share one wall — do NOT create duplicate walls at the same position.

### Furniture Placement — CRITICAL
PAD = 25 (minimum pixels from any wall to furniture edge)

1. CHECK FIT: item (fw × fh) fits in room (rw × rh) only if fw ≤ rw - 2×PAD AND fh ≤ rh - 2×PAD. Skip items that don't fit.

2. PLACEMENT STRATEGIES (pick one per item). All coordinates are CENTERS:
   - Against a wall — the item's EDGE sits PAD from the wall, so its centre is
     PAD + half the item's size away:
     • Against top wall:    y = ry + PAD + fh/2,        x = rx + rw/2 (or slide along)
     • Against bottom wall: y = ry + rh - PAD - fh/2,   x = rx + rw/2
     • Against left wall:   x = rx + PAD + fw/2,        y = ry + rh/2
     • Against right wall:  x = rx + rw - PAD - fw/2,   y = ry + rh/2
   - Centered in the room:  x = rx + rw/2,              y = ry + rh/2
   - Corner: combine one horizontal and one vertical wall-flush value.

   SANITY CHECK every item before you emit it:
     x - fw/2 >= rx + PAD   AND   x + fw/2 <= rx + rw - PAD
     y - fh/2 >= ry + PAD   AND   y + fh/2 <= ry + rh - PAD
   If a value fails, the item is sticking through a wall — recompute or skip it.

3. ANTI-OVERLAP — MANDATORY:
   Before placing each item, check against ALL previously placed items in the same room.
   Because coordinates are centres, A and B overlap if BOTH are true:
     |A.x - B.x| < (A.w + B.w)/2 + 20
     |A.y - B.y| < (A.h + B.h)/2 + 20
   If overlap detected → shift the new item. If it still doesn't fit → skip it.

4. ROTATION: Use rotation=0 for default orientation (width along X, height along Y).
   Use rotation=90 to swap width/height (item rotated 90° clockwise).
   When rotated 90°, the effective dimensions become (height × width) instead of (width × height).

### Typical Room Furnishing Guide
- Living room: Sofa against a wall, Coffee Table centered in front, TV Stand on opposite wall, maybe an Armchair
- Bedroom: Bed centered against top or side wall, Nightstand(s) beside bed, Dresser or Wardrobe on opposite wall
- Kitchen: Refrigerator in corner, Stove next to it along same wall, Kitchen Island centered (if space allows)
- Bathroom: Toilet against wall, Sink nearby, Bathtub or Shower along longest wall
- Office: Desk against wall, Office Chair in front of desk, Bookcase or Filing Cabinet on side wall
- Dining: Dining Table centered, Chairs around the table (2-6 depending on size)

### Door & Window Placement
- Each room should have at least 1 door (typically in a shared wall for interior rooms, or exterior wall for entry).
- position is 0.0–1.0 along the wall's length. Use 0.5 for center.
- Exterior walls can have windows (position 0.3–0.7 works well).

## FURNITURE IDs
- ALWAYS use exact UUIDs from fetch_canvas catalog. NEVER invent IDs.
- Copy UUIDs character-for-character.

## EXAMPLE — 2-Bedroom Apartment

Room layout (starting at 40,40):
  Living Room:  (40, 40)    → 420×360
  Kitchen:      (460, 40)   → 300×360
  Bedroom 1:    (40, 400)   → 380×340
  Bedroom 2:    (420, 400)  → 340×340

Shared walls: Living/Kitchen share wall at x=460. Living/Bedroom1 share wall at y=400. etc.

Living Room (40,40, 420x360) furniture — remember x,y are CENTRES:
  Sofa (200x90):         x = 40+420/2 = 250,        y = 40+360-25-45 = 330   (against bottom wall)
  Coffee Table (120x60): x = 250,                   y = 330-45-20-30 = 235   (above the sofa)
  TV Stand (150x40):     x = 250,                   y = 40+25+20 = 85        (against top wall)

Bedroom 1 (40,400, 380x340) furniture:
  Double Bed (200x160):  x = 40+380/2 = 230,        y = 400+25+80 = 505      (against top wall)
  Nightstand (50x40):    x = 230-100-15-25 = 90,    y = 505-80+20 = 445      (left of the bed)
  Dresser (100x45):      x = 40+380-25-50 = 345,    y = 400+340-25-22 = 693  (bottom-right)

Verify the Sofa: it spans x 150..350 (inside 40..460) and y 285..375 (inside 40..400). Good.`;

  const abortController = new AbortController();
  res.on("close", () => abortController.abort());

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools,
      stopWhen: stepCountIs(25),
      abortSignal: abortController.signal,
    });

    for await (const chunk of result.fullStream) {
      if (abortController.signal.aborted) break;
      if (chunk.type === "text-delta") {
        res.write(`data: ${JSON.stringify({ type: "text", content: chunk.text })}\n\n`);
      } else if (chunk.type === "tool-call") {
        res.write(`data: ${JSON.stringify({ type: "tool_call", name: chunk.toolName })}\n\n`);
      } else if (chunk.type === "tool-result") {
        const output = chunk.output as ToolResult | undefined;
        if (output?.action) {
          res.write(`data: ${JSON.stringify({ type: "action", ...output.action })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: "tool_done", name: chunk.toolName })}\n\n`);
      } else if (chunk.type === "tool-error") {
        logger.error("design-chat tool failed", {
          designId,
          tool: chunk.toolName,
          error: chunk.error instanceof Error ? chunk.error.message : String(chunk.error),
        });
        res.write(`data: ${JSON.stringify({ type: "tool_done", name: chunk.toolName })}\n\n`);
      } else if (chunk.type === "error") {
        logger.error("design-chat stream error", {
          designId,
          error: chunk.error instanceof Error ? chunk.error.message : String(chunk.error),
        });
        res.write(
          `data: ${JSON.stringify({ type: "error", message: "The assistant hit an error. Please try again." })}\n\n`,
        );
      }
    }
  } catch (err) {
    if (!abortController.signal.aborted && !res.writableEnded) {
      const msg = err instanceof Error ? err.message : "AI error";
      res.write(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`);
    }
  }

  if (!res.writableEnded) {
    res.write("data: [DONE]\n\n");
    res.end();
  }
};
