import OpenAI from "openai";
import type { Response } from "express";
import { config } from "../lib/config";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import { serializeFurnitureItem } from "../lib/serializers";
import type { CatalogItem } from "../schemas/canvas.schema";

if (!config.openaiApiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Set OPENAI_API_KEY in the environment or in server/.env (see server/.env.example).",
  );
}

const openai = new OpenAI({ apiKey: config.openaiApiKey });

interface FurnishRequest {
  roomId: string;
  roomType: string;
  style: string;
  width: number;
  height: number;
  existingFurniture?: string[];
}

interface Placement {
  item: string;
  at: [number, number];
  rotation: number;
}

const CATEGORY_FOR_USAGE: Record<string, CatalogItem["category"]> = {
  living_room: "living_room",
  bedroom: "bedroom",
  kitchen: "kitchen",
  bathroom: "bathroom",
  office: "office",
  dining: "kitchen",
};

const buildPrompt = (req: FurnishRequest, items: CatalogItem[]): string => {
  const list = items
    .map((i) => `- ${i.name} (id: ${i.id}, ${i.size[0]} × ${i.size[1]} mm)`)
    .join("\n");

  const existing = req.existingFurniture?.length
    ? `\nAlready placed: ${req.existingFurniture.join(", ")}. Do not duplicate these.`
    : "";

  return `You are an interior designer. Furnish a ${req.roomType} room of ${req.width} × ${req.height} mm in ${req.style} style.
${existing}

Available items:
${list}

Return a JSON array of placements. Each placement has:
- item: the exact id from the list above
- x: centre position in mm from the room's left edge
- y: centre position in mm from the room's top edge
- rotation: 0, 90, 180 or 270

Rules:
- Only use items from the list
- Items must not overlap and must fit entirely inside the room
- Leave walkable paths of at least 600 mm
- Place items sensibly (bed against a wall, desk near a window, and so on)

Respond ONLY with the JSON array.`;
};

const send = (res: Response, data: Record<string, unknown>) =>
  res.write(`data: ${JSON.stringify(data)}\n\n`);

const finish = (res: Response) => {
  res.write("data: [DONE]\n\n");
  res.end();
};

export const furnishRoom = async (req: FurnishRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const category = CATEGORY_FOR_USAGE[req.roomType] ?? "living_room";
    const items = (await prisma.furnitureItem.findMany({ where: { category } })).map(
      serializeFurnitureItem,
    );

    if (items.length === 0) {
      send(res, { type: "error", message: "No furniture items available for this room type" });
      return finish(res);
    }

    send(res, { type: "status", message: "Analyzing room layout..." });

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interior designer AI. Always respond with valid JSON.",
        },
        { role: "user", content: buildPrompt(req, items) },
      ],
      temperature: 0.7,
      stream: true,
    });

    send(res, { type: "status", message: "Generating furniture placements..." });

    let full = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        full += delta;
        send(res, { type: "chunk", content: delta });
      }
    }

    let raw: { item?: string; x?: number; y?: number; rotation?: number }[] = [];
    try {
      const match = full.match(/\[[\s\S]*\]/);
      if (match) raw = JSON.parse(match[0]);
    } catch {
      logger.error("Failed to parse AI furniture suggestions", { content: full });
      send(res, { type: "error", message: "Failed to parse AI response" });
      return finish(res);
    }

    const valid = new Set(items.map((i) => i.id));
    const placements: Placement[] = raw
      .filter(
        (p) =>
          typeof p.item === "string" &&
          valid.has(p.item) &&
          typeof p.x === "number" &&
          typeof p.y === "number" &&
          p.x >= 0 &&
          p.x <= req.width &&
          p.y >= 0 &&
          p.y <= req.height,
      )
      .map((p) => ({
        item: p.item as string,
        at: [Math.round(p.x as number), Math.round(p.y as number)],
        rotation: p.rotation ?? 0,
      }));

    send(res, { type: "suggestions", placements });
    finish(res);
  } catch (err) {
    logger.error("AI furnish room failed", { error: err });
    send(res, { type: "error", message: "AI service error" });
    finish(res);
  }
};
