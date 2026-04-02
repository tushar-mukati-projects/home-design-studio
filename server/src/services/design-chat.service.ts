import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { getDesignById, updateDesign } from "./design.service";

const FURNITURE_CATALOG = [
  {
    id: "sofa",
    name: "Sofa",
    category: "living-room",
    width: 200,
    height: 90,
    depth: 85,
    color: "#9ca3af",
  },
  {
    id: "armchair",
    name: "Armchair",
    category: "living-room",
    width: 85,
    height: 85,
    depth: 80,
    color: "#9ca3af",
  },
  {
    id: "coffee-table",
    name: "Coffee Table",
    category: "living-room",
    width: 120,
    height: 60,
    depth: 45,
    color: "#a1a1aa",
  },
  {
    id: "tv-stand",
    name: "TV Stand",
    category: "living-room",
    width: 150,
    height: 40,
    depth: 50,
    color: "#71717a",
  },
  {
    id: "bookshelf",
    name: "Bookshelf",
    category: "living-room",
    width: 80,
    height: 30,
    depth: 200,
    color: "#a1a1aa",
  },
  {
    id: "floor-lamp",
    name: "Floor Lamp",
    category: "living-room",
    width: 30,
    height: 30,
    depth: 150,
    color: "#d4d4d8",
  },
  {
    id: "double-bed",
    name: "Double Bed",
    category: "bedroom",
    width: 200,
    height: 160,
    depth: 45,
    color: "#b4b4bc",
  },
  {
    id: "single-bed",
    name: "Single Bed",
    category: "bedroom",
    width: 200,
    height: 90,
    depth: 45,
    color: "#b4b4bc",
  },
  {
    id: "nightstand",
    name: "Nightstand",
    category: "bedroom",
    width: 50,
    height: 40,
    depth: 55,
    color: "#a1a1aa",
  },
  {
    id: "wardrobe",
    name: "Wardrobe",
    category: "bedroom",
    width: 120,
    height: 60,
    depth: 200,
    color: "#71717a",
  },
  {
    id: "dresser",
    name: "Dresser",
    category: "bedroom",
    width: 100,
    height: 45,
    depth: 80,
    color: "#a1a1aa",
  },
  {
    id: "desk",
    name: "Desk",
    category: "bedroom",
    width: 120,
    height: 60,
    depth: 75,
    color: "#a1a1aa",
  },
  {
    id: "dining-table",
    name: "Dining Table",
    category: "kitchen",
    width: 160,
    height: 90,
    depth: 75,
    color: "#a1a1aa",
  },
  {
    id: "dining-chair",
    name: "Dining Chair",
    category: "kitchen",
    width: 45,
    height: 45,
    depth: 90,
    color: "#9ca3af",
  },
  {
    id: "kitchen-island",
    name: "Kitchen Island",
    category: "kitchen",
    width: 120,
    height: 80,
    depth: 90,
    color: "#d4d4d8",
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    category: "kitchen",
    width: 70,
    height: 70,
    depth: 180,
    color: "#e4e4e7",
  },
  {
    id: "stove",
    name: "Stove",
    category: "kitchen",
    width: 60,
    height: 60,
    depth: 85,
    color: "#52525b",
  },
  {
    id: "bathtub",
    name: "Bathtub",
    category: "bathroom",
    width: 170,
    height: 75,
    depth: 60,
    color: "#f4f4f5",
  },
  {
    id: "toilet",
    name: "Toilet",
    category: "bathroom",
    width: 40,
    height: 65,
    depth: 40,
    color: "#f4f4f5",
  },
  {
    id: "sink",
    name: "Sink",
    category: "bathroom",
    width: 60,
    height: 45,
    depth: 85,
    color: "#f4f4f5",
  },
  {
    id: "shower",
    name: "Shower",
    category: "bathroom",
    width: 90,
    height: 90,
    depth: 200,
    color: "#e4e4e7",
  },
  {
    id: "office-desk",
    name: "Office Desk",
    category: "office",
    width: 140,
    height: 70,
    depth: 75,
    color: "#a1a1aa",
  },
  {
    id: "office-chair",
    name: "Office Chair",
    category: "office",
    width: 60,
    height: 60,
    depth: 110,
    color: "#52525b",
  },
  {
    id: "filing-cabinet",
    name: "Filing Cabinet",
    category: "office",
    width: 40,
    height: 50,
    depth: 70,
    color: "#d4d4d8",
  },
  {
    id: "bookcase",
    name: "Bookcase",
    category: "office",
    width: 90,
    height: 35,
    depth: 180,
    color: "#a1a1aa",
  },
];

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
  let viewportState = { gridSize: 20, zoom: 1, panX: 0, panY: 0 };
  let designFetched = false;

  const tools = {
    fetch_design: tool({
      description:
        "Fetch the current design from the database. Always call this first to understand the existing layout before making any changes.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        const design = await getDesignById(designId, userId, email);
        if (!design) return { summary: "Design not found or access denied." };

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

        if (
          canvasState.walls.length === 0 &&
          canvasState.rooms.length === 0 &&
          canvasState.furniture.length === 0
        ) {
          return {
            summary: `Design "${design.name}" is empty (${design.width}×${design.height}px). Ready to build.`,
          };
        }

        return {
          summary: [
            `Design: "${design.name}" (${design.width}×${design.height}px)`,
            `${canvasState.walls.length} wall(s) indexed 0–${canvasState.walls.length - 1}`,
            `${canvasState.rooms.length} room(s): ${canvasState.rooms.map((r) => r.name).join(", ") || "none"}`,
            `${canvasState.furniture.length} furniture: ${canvasState.furniture.map((f) => f.furnitureItem.name).join(", ") || "none"}`,
            `${canvasState.doors.length} door(s), ${canvasState.windows.length} window(s)`,
          ].join("; "),
        };
      },
    }),

    edit_design: tool({
      description: `Apply an edit to the design canvas. Supported operations:
- add_wall: x1, y1, x2, y2 required; thickness optional (default 12)
- add_room: name, roomType, x, y, width, height required
- place_furniture: furnitureId, x, y required; rotation optional
- add_door: wallIndex (0-based), position (0–1) required; doorType, width optional
- add_window: wallIndex (0-based), position (0–1) required; width optional
- remove_element: elementType (wall|room|furniture|door|window), elementId required
- clear_all: removes everything from the canvas
Available furniture IDs: ${FURNITURE_CATALOG.map((f) => `${f.id} (${f.name}, ${f.width}×${f.height}px)`).join(", ")}`,
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
            summary: `Wall added from (${x1},${y1}) to (${x2},${y2})`,
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
            summary: `Room "${name}" added (${width}×${height}px at ${x},${y})`,
            action: { actionType: "add_room", payload: room },
          };
        }

        if (operation === "place_furniture") {
          const { furnitureId, x, y, rotation } = params;
          if (!furnitureId || x == null || y == null) {
            return { summary: "place_furniture requires furnitureId, x, y" };
          }
          const item = FURNITURE_CATALOG.find((f) => f.id === furnitureId);
          if (!item) {
            return {
              summary: `Unknown furnitureId "${furnitureId}". Valid IDs: ${FURNITURE_CATALOG.map((f) => f.id).join(", ")}`,
            };
          }
          const placed: PlacedFurniture = {
            id: randomUUID(),
            furnitureItemId: furnitureId,
            furnitureItem: item,
            x,
            y,
            rotation: rotation ?? 0,
            scaleX: 1,
            scaleY: 1,
          };
          canvasState.furniture.push(placed);
          return {
            summary: `${item.name} placed at (${x},${y})`,
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
              summary: `No wall at index ${wallIndex}. There are ${canvasState.walls.length} wall(s).`,
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
            summary: `${door.type} door added on wall ${wallIndex} at position ${position}`,
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
              summary: `No wall at index ${wallIndex}. There are ${canvasState.walls.length} wall(s).`,
            };
          }
          const win: Win = { id: randomUUID(), wallId: wall.id, position, width: width ?? 100 };
          canvasState.windows.push(win);
          return {
            summary: `Window added on wall ${wallIndex} at position ${position}`,
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
            summary: `${elementType} ${elementId} removed`,
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

    review_design: tool({
      description:
        "Review the current design state in detail — exact positions, IDs, and dimensions. Use this to verify the layout or get element IDs before removing elements.",
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
                    `  [${i}] id=${w.id} (${w.x1},${w.y1})→(${w.x2},${w.y2}) thickness=${w.thickness ?? 12}`,
                )
                .join("\n"),
          );
        }
        if (rooms.length > 0) {
          parts.push(
            `Rooms (${rooms.length}):\n` +
              rooms.map((r) => `  "${r.name}" [${r.type}] id=${r.id} area=${r.area}`).join("\n"),
          );
        }
        if (furniture.length > 0) {
          parts.push(
            `Furniture (${furniture.length}):\n` +
              furniture
                .map(
                  (f) =>
                    `  ${f.furnitureItem.name} at (${f.x},${f.y}) rot=${f.rotation ?? 0} id=${f.id}`,
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

    save_design: tool({
      description:
        "Persist all changes to the database. Always call this after making edits — changes are not saved automatically.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        if (!designFetched) {
          return { summary: "Call fetch_design first before saving." };
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
            summary: "Design saved successfully.",
            action: { actionType: "saved", payload: {} },
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Save failed";
          return { summary: `Failed to save: ${msg}` };
        }
      },
    }),
  };

  const system = `You are an AI assistant for a 2D home design editor. You build and modify floor plans by calling tools.

WORKFLOW — follow these steps every turn:
1. Call fetch_design to load the current design state from the database
2. Plan your edits based on what you see
3. Call edit_design one or more times to apply changes (each call updates the canvas in real time)
4. Optionally call review_design to verify the current layout
5. Call save_design to persist all changes
6. Write a brief confirmation of what was done

CANVAS RULES:
- Default canvas is 800×600px. Scale: 1 ft ≈ 30px
- Typical room sizes: living room 350×300px, bedroom 300×300px, kitchen 250×250px, bathroom 180×180px
- Create walls first (closed rectangles), then add rooms that match the enclosed area
- Wall thickness is 12px, color #52525b
- Place furniture centered in rooms with 30–50px margin from walls
- You may call edit_design up to 15 times per turn for complex layouts`;

  try {
    const result = streamText({
      model: openai("gpt-5.4-mini"),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools,
      stopWhen: stepCountIs(20),
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
