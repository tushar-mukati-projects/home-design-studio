import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Response } from "express";
import { randomUUID } from "crypto";

const FURNITURE_CATALOG = [
  { id: "sofa", name: "Sofa", category: "living-room", width: 200, height: 90, depth: 85, color: "#9ca3af" },
  { id: "armchair", name: "Armchair", category: "living-room", width: 85, height: 85, depth: 80, color: "#9ca3af" },
  { id: "coffee-table", name: "Coffee Table", category: "living-room", width: 120, height: 60, depth: 45, color: "#a1a1aa" },
  { id: "tv-stand", name: "TV Stand", category: "living-room", width: 150, height: 40, depth: 50, color: "#71717a" },
  { id: "bookshelf", name: "Bookshelf", category: "living-room", width: 80, height: 30, depth: 200, color: "#a1a1aa" },
  { id: "floor-lamp", name: "Floor Lamp", category: "living-room", width: 30, height: 30, depth: 150, color: "#d4d4d8" },
  { id: "double-bed", name: "Double Bed", category: "bedroom", width: 200, height: 160, depth: 45, color: "#b4b4bc" },
  { id: "single-bed", name: "Single Bed", category: "bedroom", width: 200, height: 90, depth: 45, color: "#b4b4bc" },
  { id: "nightstand", name: "Nightstand", category: "bedroom", width: 50, height: 40, depth: 55, color: "#a1a1aa" },
  { id: "wardrobe", name: "Wardrobe", category: "bedroom", width: 120, height: 60, depth: 200, color: "#71717a" },
  { id: "dresser", name: "Dresser", category: "bedroom", width: 100, height: 45, depth: 80, color: "#a1a1aa" },
  { id: "desk", name: "Desk", category: "bedroom", width: 120, height: 60, depth: 75, color: "#a1a1aa" },
  { id: "dining-table", name: "Dining Table", category: "kitchen", width: 160, height: 90, depth: 75, color: "#a1a1aa" },
  { id: "dining-chair", name: "Dining Chair", category: "kitchen", width: 45, height: 45, depth: 90, color: "#9ca3af" },
  { id: "kitchen-island", name: "Kitchen Island", category: "kitchen", width: 120, height: 80, depth: 90, color: "#d4d4d8" },
  { id: "refrigerator", name: "Refrigerator", category: "kitchen", width: 70, height: 70, depth: 180, color: "#e4e4e7" },
  { id: "stove", name: "Stove", category: "kitchen", width: 60, height: 60, depth: 85, color: "#52525b" },
  { id: "bathtub", name: "Bathtub", category: "bathroom", width: 170, height: 75, depth: 60, color: "#f4f4f5" },
  { id: "toilet", name: "Toilet", category: "bathroom", width: 40, height: 65, depth: 40, color: "#f4f4f5" },
  { id: "sink", name: "Sink", category: "bathroom", width: 60, height: 45, depth: 85, color: "#f4f4f5" },
  { id: "shower", name: "Shower", category: "bathroom", width: 90, height: 90, depth: 200, color: "#e4e4e7" },
  { id: "office-desk", name: "Office Desk", category: "office", width: 140, height: 70, depth: 75, color: "#a1a1aa" },
  { id: "office-chair", name: "Office Chair", category: "office", width: 60, height: 60, depth: 110, color: "#52525b" },
  { id: "filing-cabinet", name: "Filing Cabinet", category: "office", width: 40, height: 50, depth: 70, color: "#d4d4d8" },
  { id: "bookcase", name: "Bookcase", category: "office", width: 90, height: 35, depth: 180, color: "#a1a1aa" },
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

export interface CanvasState {
  walls: Array<{ id: string; x1: number; y1: number; x2: number; y2: number; thickness?: number; color?: string }>;
  rooms: Array<{ id: string; name: string; type: string; color?: string; points: { x: number; y: number }[]; area?: number }>;
  furniture: Array<{ id: string; furnitureItemId: string; furnitureItem: { id: string; name: string; category: string; width: number; height: number; depth?: number; color?: string }; x: number; y: number; rotation?: number; scaleX?: number; scaleY?: number }>;
  doors: Array<{ id: string; wallId: string; position: number; width?: number; type?: string }>;
  windows: Array<{ id: string; wallId: string; position: number; width?: number }>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ToolResult = { summary: string; action?: { actionType: string; payload: object } };

const makeTools = (canvasState: CanvasState) => ({
  get_design_summary: tool({
    description: "Get a summary of the current design state. Call this first to understand what's already on the canvas before making changes.",
    inputSchema: z.object({}),
    execute: async (): Promise<ToolResult> => {
      const { walls, rooms, furniture, doors, windows } = canvasState;
      if (walls.length === 0 && rooms.length === 0 && furniture.length === 0) {
        return { summary: "The canvas is empty — no walls, rooms, or furniture yet." };
      }
      return {
        summary: [
          `${walls.length} wall(s) — indexed 0 to ${walls.length - 1}`,
          `${rooms.length} room(s): ${rooms.map((r) => r.name).join(", ") || "none"}`,
          `${furniture.length} furniture: ${furniture.map((f) => f.furnitureItem.name).join(", ") || "none"}`,
          `${doors.length} door(s), ${windows.length} window(s)`,
        ].join("; "),
      };
    },
  }),

  add_wall: tool({
    description: "Add a straight wall segment. Canvas is typically 600–1200px wide, 400–800px tall. Use thickness 12.",
    inputSchema: z.object({
      x1: z.number().describe("Start x coordinate"),
      y1: z.number().describe("Start y coordinate"),
      x2: z.number().describe("End x coordinate"),
      y2: z.number().describe("End y coordinate"),
      thickness: z.number().optional().describe("Wall thickness in pixels, default 12"),
    }),
    execute: async ({ x1, y1, x2, y2, thickness }): Promise<ToolResult> => {
      const wall = { id: randomUUID(), x1, y1, x2, y2, thickness: thickness ?? 12, color: "#52525b" };
      canvasState.walls.push(wall);
      return { summary: `Added wall from (${x1},${y1}) to (${x2},${y2})`, action: { actionType: "add_wall", payload: wall } };
    },
  }),

  add_room: tool({
    description: "Add a rectangular room zone defined by its top-left corner x,y and width/height.",
    inputSchema: z.object({
      name: z.string().describe("Room name e.g. 'Living Room'"),
      type: z.enum(["living_room", "bedroom", "kitchen", "bathroom", "dining", "office", "hallway", "closet", "generic"]),
      x: z.number().describe("Top-left x coordinate"),
      y: z.number().describe("Top-left y coordinate"),
      width: z.number().describe("Room width in pixels"),
      height: z.number().describe("Room height in pixels"),
    }),
    execute: async ({ name, type, x, y, width, height }): Promise<ToolResult> => {
      const room = {
        id: randomUUID(), name, type,
        color: ROOM_COLORS[type] ?? ROOM_COLORS.generic,
        points: [{ x, y }, { x: x + width, y }, { x: x + width, y: y + height }, { x, y: y + height }],
        area: width * height,
      };
      canvasState.rooms.push(room);
      return { summary: `Added room "${name}" (${width}×${height}px) at (${x},${y})`, action: { actionType: "add_room", payload: room } };
    },
  }),

  place_furniture: tool({
    description: `Place a furniture item at a center position. Available IDs: ${FURNITURE_CATALOG.map((f) => `${f.id} (${f.name}, ${f.width}×${f.height}px)`).join(", ")}`,
    inputSchema: z.object({
      furnitureId: z.string().describe("Furniture ID from the catalog"),
      x: z.number().describe("Center x position"),
      y: z.number().describe("Center y position"),
      rotation: z.number().optional().describe("Rotation in degrees (0/90/180/270), default 0"),
    }),
    execute: async ({ furnitureId, x, y, rotation }): Promise<ToolResult> => {
      const item = FURNITURE_CATALOG.find((f) => f.id === furnitureId);
      if (!item) return { summary: `Unknown furniture ID: ${furnitureId}` };
      const placed = { id: randomUUID(), furnitureItemId: furnitureId, furnitureItem: item, x, y, rotation: rotation ?? 0, scaleX: 1, scaleY: 1 };
      canvasState.furniture.push(placed);
      return { summary: `Placed ${item.name} at (${x},${y})`, action: { actionType: "place_furniture", payload: placed } };
    },
  }),

  add_door: tool({
    description: "Add a door opening to an existing wall by wall index (0-based). Position is 0–1 fraction along the wall.",
    inputSchema: z.object({
      wallIndex: z.number().int().describe("0-based index of the wall"),
      position: z.number().min(0).max(1).describe("Position along the wall as 0–1 fraction"),
      width: z.number().optional().describe("Door width in pixels, default 80"),
      doorType: z.enum(["single", "double", "sliding"]).optional().describe("Default: single"),
    }),
    execute: async ({ wallIndex, position, width, doorType }): Promise<ToolResult> => {
      const wall = canvasState.walls[wallIndex];
      if (!wall) return { summary: `No wall at index ${wallIndex}` };
      const door = { id: randomUUID(), wallId: wall.id, position, width: width ?? 80, type: doorType ?? "single" };
      canvasState.doors.push(door);
      return { summary: `Added ${door.type} door on wall ${wallIndex} at position ${position}`, action: { actionType: "add_door", payload: door } };
    },
  }),

  add_window: tool({
    description: "Add a window opening to an existing wall by wall index (0-based). Position is 0–1 fraction along the wall.",
    inputSchema: z.object({
      wallIndex: z.number().int().describe("0-based index of the wall"),
      position: z.number().min(0).max(1).describe("Position along the wall as 0–1 fraction"),
      width: z.number().optional().describe("Window width in pixels, default 100"),
    }),
    execute: async ({ wallIndex, position, width }): Promise<ToolResult> => {
      const wall = canvasState.walls[wallIndex];
      if (!wall) return { summary: `No wall at index ${wallIndex}` };
      const win = { id: randomUUID(), wallId: wall.id, position, width: width ?? 100 };
      canvasState.windows.push(win);
      return { summary: `Added window on wall ${wallIndex} at position ${position}`, action: { actionType: "add_window", payload: win } };
    },
  }),

  clear_design: tool({
    description: "Remove all elements from the canvas. Only use when user explicitly asks to start fresh.",
    inputSchema: z.object({}),
    execute: async (): Promise<ToolResult> => {
      canvasState.walls.length = 0;
      canvasState.rooms.length = 0;
      canvasState.furniture.length = 0;
      canvasState.doors.length = 0;
      canvasState.windows.length = 0;
      return { summary: "Cleared all elements from the canvas.", action: { actionType: "clear_design", payload: {} } };
    },
  }),
});

export const designChatStream = async (
  messages: ChatMessage[],
  canvasState: CanvasState,
  res: Response,
) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const system = `You are an AI assistant for a 2D home design editor. Help users design floor plans by adding elements directly to their canvas.

CURRENT CANVAS: ${canvasState.walls.length} walls, ${canvasState.rooms.length} rooms, ${canvasState.furniture.length} furniture, ${canvasState.doors.length} doors, ${canvasState.windows.length} windows.

RULES:
- Call get_design_summary first if you need to understand the existing layout.
- Canvas is typically 800×600px. 1 ft ≈ 30px. Standard room: bedroom ~300×300px, kitchen ~250×250px.
- Always create walls before rooms. Walls connect end-to-end to form closed outlines (thickness 12).
- Place furniture centered inside rooms with 30–50px margin from walls.
- You can call multiple tools in one turn to build a complete layout.
- After finishing, confirm concisely what was added.`;

  try {
    const result = streamText({
      model: openai("gpt-4o"),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      tools: makeTools(canvasState),
      stopWhen: stepCountIs(8),
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
