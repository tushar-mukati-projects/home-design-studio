import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { getDesignById, updateDesign } from "./design.service";
import { prisma } from "../db";

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

const DEFAULT_FURNITURE = [
  { name: "Sofa", category: "living_room", width: 200, height: 90, depth: 85, color: "#9ca3af" },
  { name: "Armchair", category: "living_room", width: 85, height: 85, depth: 80, color: "#9ca3af" },
  {
    name: "Coffee Table",
    category: "living_room",
    width: 120,
    height: 60,
    depth: 45,
    color: "#a1a1aa",
  },
  {
    name: "TV Stand",
    category: "living_room",
    width: 150,
    height: 40,
    depth: 50,
    color: "#71717a",
  },
  {
    name: "Bookshelf",
    category: "living_room",
    width: 80,
    height: 30,
    depth: 200,
    color: "#a1a1aa",
  },
  {
    name: "Floor Lamp",
    category: "living_room",
    width: 30,
    height: 30,
    depth: 150,
    color: "#d4d4d8",
  },
  { name: "Double Bed", category: "bedroom", width: 200, height: 160, depth: 45, color: "#b4b4bc" },
  { name: "Single Bed", category: "bedroom", width: 200, height: 90, depth: 45, color: "#b4b4bc" },
  { name: "Nightstand", category: "bedroom", width: 50, height: 40, depth: 55, color: "#a1a1aa" },
  { name: "Wardrobe", category: "bedroom", width: 120, height: 60, depth: 200, color: "#71717a" },
  { name: "Dresser", category: "bedroom", width: 100, height: 45, depth: 80, color: "#a1a1aa" },
  { name: "Desk", category: "bedroom", width: 120, height: 60, depth: 75, color: "#a1a1aa" },
  { name: "Dining Table", category: "dining", width: 160, height: 90, depth: 75, color: "#a1a1aa" },
  { name: "Dining Chair", category: "dining", width: 45, height: 45, depth: 90, color: "#9ca3af" },
  {
    name: "Kitchen Island",
    category: "kitchen",
    width: 120,
    height: 80,
    depth: 90,
    color: "#d4d4d8",
  },
  {
    name: "Refrigerator",
    category: "kitchen",
    width: 70,
    height: 70,
    depth: 180,
    color: "#e4e4e7",
  },
  { name: "Stove", category: "kitchen", width: 60, height: 60, depth: 85, color: "#52525b" },
  { name: "Bathtub", category: "bathroom", width: 170, height: 75, depth: 60, color: "#f4f4f5" },
  { name: "Toilet", category: "bathroom", width: 40, height: 65, depth: 40, color: "#f4f4f5" },
  { name: "Sink", category: "bathroom", width: 60, height: 45, depth: 85, color: "#f4f4f5" },
  { name: "Shower", category: "bathroom", width: 90, height: 90, depth: 200, color: "#e4e4e7" },
  { name: "Office Desk", category: "office", width: 140, height: 70, depth: 75, color: "#a1a1aa" },
  { name: "Office Chair", category: "office", width: 60, height: 60, depth: 110, color: "#52525b" },
  {
    name: "Filing Cabinet",
    category: "office",
    width: 40,
    height: 50,
    depth: 70,
    color: "#d4d4d8",
  },
  { name: "Bookcase", category: "office", width: 90, height: 35, depth: 180, color: "#a1a1aa" },
];

async function ensureFurnitureSeeded(): Promise<void> {
  const count = await prisma.furnitureItem.count();
  if (count > 0) return;
  await prisma.furnitureItem.createMany({
    data: DEFAULT_FURNITURE.map((f) => ({ ...f, isDefault: true })),
    skipDuplicates: true,
  });
}

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
  let viewportState = { gridSize: 20, zoom: 1, panX: 0, panY: 0 };
  let designFetched = false;
  let availableFurnitureItems: FurnitureItem[] = [];

  const tools = {
    fetch_canvas: tool({
      description:
        "Fetch the complete canvas state from the database — walls, rooms, placed furniture, doors, and windows — plus all available furniture items that can be placed. ALWAYS call this first before making any changes so you know the current state and valid furniture IDs.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        await ensureFurnitureSeeded();
        const [design, dbFurnitureItems] = await Promise.all([
          getDesignById(designId, userId, email),
          prisma.furnitureItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
        ]);

        if (!design) return { summary: "Design not found or access denied." };

        availableFurnitureItems = dbFurnitureItems;

        const cd = design.canvasData as Record<string, unknown>;
        canvasState.walls = (cd.walls as Wall[]) ?? [];
        canvasState.doors = (cd.doors as Door[]) ?? [];
        canvasState.windows = (cd.windows as Win[]) ?? [];
        canvasState.rooms = (design.rooms as unknown as Room[]) ?? [];
        canvasState.furniture = (design.furniture as unknown as PlacedFurniture[]) ?? [];
        viewportState = {
          gridSize: (cd.gridSize as number) ?? 20,
          zoom: (cd.zoom as number) ?? 1,
          panX: (cd.panX as number) ?? 0,
          panY: (cd.panY as number) ?? 0,
        };
        designFetched = true;

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
        try {
          await updateDesign(
            designId,
            {
              canvasData: {
                ...viewportState,
                walls: canvasState.walls,
                doors: canvasState.doors,
                windows: canvasState.windows,
              },
              rooms: canvasState.rooms.map((r) => ({
                id: r.id,
                name: r.name,
                type: r.type,
                color: r.color ?? ROOM_COLORS[r.type] ?? ROOM_COLORS.generic,
                points: r.points,
                area: r.area ?? 0,
              })),
              furniture: canvasState.furniture.map((f) => ({
                id: f.id,
                x: f.x,
                y: f.y,
                rotation: f.rotation ?? 0,
                scaleX: f.scaleX ?? 1,
                scaleY: f.scaleY ?? 1,
                furnitureItemId: f.furnitureItemId,
                roomId: null,
              })),
            },
            userId,
            email,
          );
          return {
            summary: `Saved: ${canvasState.walls.length} walls, ${canvasState.rooms.length} rooms, ${canvasState.furniture.length} furniture items, ${canvasState.doors.length} doors, ${canvasState.windows.length} windows.`,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Save failed";
          return { summary: `Failed to save: ${msg}` };
        }
      },
    }),
  };

  const system = `You are an AI assistant for a 2D home design canvas editor. You build and modify 2D floor plans using tools.

## TOOLS
- fetch_canvas   → ALWAYS call first. Loads canvas state + furniture catalog with valid UUIDs.
- set_canvas     → Replace ENTIRE canvas in ONE call. Use for new designs, full rebuilds, "start over".
- edit_canvas    → Add or remove ONE element. Use ONLY for tiny tweaks (≤2 calls per turn).
- review_canvas  → Inspect exact positions and IDs. Use before targeted removals.
- save_canvas    → Persist to DB. ALWAYS call last.

## WORKFLOW (every turn)
New/major design:  fetch_canvas → set_canvas → save_canvas       (3 steps)
Small tweak:       fetch_canvas → edit_canvas → save_canvas       (3 steps)

---

## STEP 1 — PLAN YOUR GRID BEFORE WRITING ANY COORDINATES

Count total rooms N. Choose rows/cols:
  N=1 → rows=1, cols=1
  N=2 → rows=1, cols=2
  N=3 → rows=1, cols=3
  N=4 → rows=2, cols=2
  N=5 → rows=2, cols=3  (5th room at row=1,col=1 — last slot stays empty)
  N=6 → rows=2, cols=3
  N=7–9 → rows=3, cols=3

Then compute ROOM dimensions (MARGIN=40, GAP=25):
  ROOM_W = floor((800 - 2×MARGIN - (cols-1)×GAP) / cols)
  ROOM_H = floor((600 - 2×MARGIN - (rows-1)×GAP) / rows)

Position of room at (row r, col c) — both 0-indexed:
  room_x = MARGIN + c × (ROOM_W + GAP)
  room_y = MARGIN + r × (ROOM_H + GAP)

EXAMPLE — 5 office rooms (rows=2, cols=3):
  MARGIN=40, GAP=25, cols=3, rows=2
  ROOM_W = floor((800-80-50)/3) = floor(670/3) = 223
  ROOM_H = floor((600-80-25)/2) = floor(495/2) = 247
  Room1 (r=0,c=0): x=40,  y=40
  Room2 (r=0,c=1): x=288, y=40
  Room3 (r=0,c=2): x=536, y=40
  Room4 (r=1,c=0): x=40,  y=312
  Room5 (r=1,c=1): x=288, y=312

---

## STEP 2 — WALLS (4 segments per room)

For each room at (rx, ry) with size (ROOM_W, ROOM_H):
  Top:    (rx,         ry)         → (rx+ROOM_W, ry)
  Right:  (rx+ROOM_W,  ry)         → (rx+ROOM_W, ry+ROOM_H)
  Bottom: (rx+ROOM_W,  ry+ROOM_H)  → (rx,        ry+ROOM_H)
  Left:   (rx,         ry+ROOM_H)  → (rx,        ry)

---

## STEP 3 — FURNITURE (per room, after computing room position)

PAD = 20 (minimum px from room edge)

A) CHECK FIT first:
   Item (fw×fh) fits in room (ROOM_W×ROOM_H) if:
     fw ≤ ROOM_W - 2×PAD   AND   fh ≤ ROOM_H - 2×PAD
   If it does NOT fit → SKIP IT, mention it in response.

B) COMPUTE POSITION (furniture top-left corner):
   Centered in room:     x = rx + floor((ROOM_W - fw) / 2),  y = ry + floor((ROOM_H - fh) / 2)
   Against top wall:     y = ry + PAD
   Against bottom wall:  y = ry + ROOM_H - fh - PAD
   Against left wall:    x = rx + PAD
   Against right wall:   x = rx + ROOM_W - fw - PAD
   Mix combinations freely (e.g. top-left corner: x=rx+PAD, y=ry+PAD)

C) ANTI-OVERLAP (15px clearance between items in same room):
   Items A(ax,ay,aw,ah) and B(bx,by,bw,bh) overlap if ALL 4 are true:
     ax < bx+bw+15  AND  bx < ax+aw+15  AND  ay < by+bh+15  AND  by < ay+ah+15
   If overlap: shift new item down → new_y = existing_y + existing_h + 15. Re-check.
   If still overlaps after shifting down: shift right → new_x = existing_x + existing_w + 15.
   If still can't fit after both shifts → SKIP IT.

EXAMPLE — Office room at (rx=40, ry=40, ROOM_W=223, ROOM_H=247):
  Office Desk (140w×70h): fits? 140≤183✓, 70≤207✓
    → top-center: x=40+floor((223-140)/2)=40+41=81, y=40+PAD=60
  Office Chair (60w×60h): fits? 60≤183✓, 60≤207✓
    → centered below desk: y=60+70+15=145, x=40+floor((223-60)/2)=40+81=121
    overlap with desk? 121<81+140+15=236✓, 81<121+60+15=196✓, 145<60+70+15=145? (145<145 is false) ✓ no overlap

---

## FURNITURE IDs
- ALWAYS use the exact UUID from the fetch_canvas catalog.
- Copy UUIDs character-for-character — never invent or guess.
- If set_canvas returns "Invalid furniture ID" → call fetch_canvas again, copy correct UUID.`;

  try {
    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools,
      stopWhen: stepCountIs(25),
    });

    for await (const chunk of result.fullStream) {
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
      } else if (chunk.type === "error") {
        const msg = chunk.error instanceof Error ? chunk.error.message : String(chunk.error);
        res.write(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI error";
    res.write(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
};
