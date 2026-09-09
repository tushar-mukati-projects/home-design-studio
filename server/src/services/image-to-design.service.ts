import OpenAI from "openai";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { config } from "../lib/config";
import { logger } from "../lib/logger";
import { FURNITURE_CATALOG } from "../lib/seed-data/furniture";
import {
  DEFAULTS,
  ROOM_USAGES,
  canvasSchema,
  emptyCanvas,
  wallLength,
  type Canvas,
  type Opening,
  type Room,
  type Wall,
} from "../schemas/canvas.schema";

if (!config.openaiApiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Set OPENAI_API_KEY in the environment or in server/.env (see server/.env.example).",
  );
}

const openai = new OpenAI({ apiKey: config.openaiApiKey });

const PX_TO_MM = 10;

interface Sketch {
  walls: { x1: number; y1: number; x2: number; y2: number }[];
  doors: { wallIndex: number; position: number; width?: number; type?: string }[];
  windows: { wallIndex: number; position: number; width?: number }[];
  rooms: { name?: string; type?: string; points: { x: number; y: number }[] }[];
  furniture: { name?: string; x: number; y: number; rotation?: number }[];
}

const catalogNames = FURNITURE_CATALOG.map((i) => i.name).join(", ");

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. You convert images of floor plans, sketches, blueprints or room photos into a structured JSON floor plan.

You MUST respond with valid JSON only — no markdown, no explanation.

=== PROCESS ===
1. Determine the overall dimensions. Choose a canvas between 800-1200 wide and 600-1000 tall that matches the aspect ratio.
2. List EVERY room as a non-overlapping rectangle. Rooms tile the plan like a grid; adjacent rooms share exact boundary coordinates.
3. Generate walls from room edges. Where two rooms share a boundary emit ONE wall. Walls are axis-aligned segments whose endpoints meet exactly at corners.
4. Place doors on interior walls between rooms and on exterior walls for entries; windows on exterior walls. wallIndex is the 0-based index into walls; position is 0.0-1.0 along the wall.
5. Place furniture inside rooms with (x, y) as the item's CENTRE. Use ONLY these names: ${catalogNames}.

=== COORDINATES ===
Origin (0,0) top-left. X rightward, Y downward.

=== ROOM TYPES ===
${ROOM_USAGES.join(", ")}

=== OUTPUT ===
{
  "walls": [{ "x1": number, "y1": number, "x2": number, "y2": number }],
  "doors": [{ "wallIndex": number, "position": number, "type": "single"|"double"|"sliding" }],
  "windows": [{ "wallIndex": number, "position": number }],
  "rooms": [{ "name": string, "type": string, "points": [{ "x": number, "y": number }] }],
  "furniture": [{ "name": string, "x": number, "y": number, "rotation": number }]
}
rooms[].points is the 4 corners of the rectangle in order.`;

const USER_PROMPT = `Analyze this image and convert it into a structured floor plan. Count every room, lay them out as non-overlapping rectangles, derive the walls (one per shared boundary), add doors and windows, then place furniture from the allowed list with every centre inside its room. If this is a photo rather than a plan, estimate one rectangular room with the visible furniture. Respond ONLY with the JSON object.`;

const mm = (px: number) => Math.round(px * PX_TO_MM);

const usage = (type: string | undefined): Room["usage"] =>
  (ROOM_USAGES as readonly string[]).includes(type ?? "") ? (type as Room["usage"]) : "generic";

const itemForName = (name: string | undefined) =>
  FURNITURE_CATALOG.find((i) => i.name.toLowerCase() === (name ?? "").toLowerCase());

const toCanvas = (sketch: Sketch): Canvas => {
  const walls: Wall[] = sketch.walls
    .filter((w) => [w.x1, w.y1, w.x2, w.y2].every((v) => typeof v === "number"))
    .map((w) => ({
      id: randomUUID(),
      from: [mm(w.x1), mm(w.y1)],
      to: [mm(w.x2), mm(w.y2)],
      thickness: DEFAULTS.wallThickness,
      height: DEFAULTS.wallHeight,
    }));

  const onWall = (index: number, position: number) => {
    const wall = walls[index];
    if (!wall) return null;
    return {
      wall,
      offset: Math.round(Math.max(0, Math.min(1, position ?? 0.5)) * wallLength(wall)),
    };
  };

  const openings: Opening[] = [];
  for (const d of sketch.doors ?? []) {
    const hit = onWall(d.wallIndex, d.position);
    if (!hit) continue;
    openings.push({
      id: randomUUID(),
      kind: "door",
      wall: hit.wall.id,
      offset: hit.offset,
      width: DEFAULTS.door.width,
      height: DEFAULTS.door.height,
      variant: ["single", "double", "sliding"].includes(d.type ?? "")
        ? (d.type as Opening["variant"])
        : "single",
      hinge: "left",
      swing: "in",
    });
  }
  for (const w of sketch.windows ?? []) {
    const hit = onWall(w.wallIndex, w.position);
    if (!hit) continue;
    openings.push({
      id: randomUUID(),
      kind: "window",
      wall: hit.wall.id,
      offset: hit.offset,
      width: DEFAULTS.window.width,
      height: DEFAULTS.window.height,
      sill: DEFAULTS.window.sill,
    });
  }

  const rooms: Room[] = (sketch.rooms ?? [])
    .filter((r) => Array.isArray(r.points) && r.points.length >= 3)
    .map((r) => ({
      id: randomUUID(),
      name: r.name || "Room",
      usage: usage(r.type),
      polygon: r.points.map((p) => [mm(p.x), mm(p.y)] as [number, number]),
    }));

  const inside = (x: number, y: number) =>
    rooms.some((r) => {
      const xs = r.polygon.map((p) => p[0]);
      const ys = r.polygon.map((p) => p[1]);
      return (
        x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys)
      );
    });

  const furniture: Canvas["furniture"] = [];
  for (const f of sketch.furniture ?? []) {
    const item = itemForName(f.name);
    if (!item || typeof f.x !== "number" || typeof f.y !== "number") continue;
    const at: [number, number] = [mm(f.x), mm(f.y)];
    if (!inside(at[0], at[1])) {
      logger.warn("Furniture outside all rooms, discarding", { name: f.name, at });
      continue;
    }
    furniture.push({ id: randomUUID(), item: item.id, at, rotation: f.rotation ?? 0 });
  }

  return { ...emptyCanvas(), walls, openings, rooms, furniture };
};

export const analyzeImage = async (imageBuffer: Buffer, mimeType: string, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const send = (data: Record<string, unknown>) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  const finish = () => {
    res.write("data: [DONE]\n\n");
    res.end();
  };

  try {
    send({ type: "status", message: "Analyzing your image..." });

    const dataUrl = `data:${mimeType};base64,${imageBuffer.toString("base64")}`;

    send({ type: "status", message: "Identifying walls, rooms, and furniture..." });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: USER_PROMPT },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      send({ type: "error", message: "AI returned empty response" });
      return finish();
    }

    send({ type: "status", message: "Building your floor plan..." });

    let sketch: Sketch;
    try {
      sketch = JSON.parse(content);
    } catch {
      logger.error("Failed to parse AI image-to-design response", { content });
      send({ type: "error", message: "Failed to parse AI response" });
      return finish();
    }

    if (!Array.isArray(sketch.walls)) {
      send({ type: "error", message: "AI did not return valid wall data" });
      return finish();
    }

    const parsed = canvasSchema.safeParse(toCanvas(sketch));
    if (!parsed.success) {
      logger.error("Image-to-design produced an invalid canvas", { issues: parsed.error.issues });
      send({ type: "error", message: "Could not build a valid floor plan from this image" });
      return finish();
    }

    const canvas = parsed.data;
    send({
      type: "status",
      message: `Found ${canvas.walls.length} walls, ${canvas.rooms.length} rooms, ${canvas.furniture.length} furniture items`,
    });
    send({ type: "result", canvas });
    finish();
  } catch (err) {
    logger.error("Image-to-design analysis failed", { error: err });
    send({ type: "error", message: "Failed to analyze image. Please try again." });
    finish();
  }
};
