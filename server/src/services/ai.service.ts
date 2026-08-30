import OpenAI from "openai";
import type { Response } from "express";
import { config } from "../lib/config";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";

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

interface FurnitureSuggestion {
  furnitureItemId: string;
  name: string;
  x: number;
  y: number;
  rotation: number;
}

const buildPrompt = (
  req: FurnishRequest,
  availableItems: { id: string; name: string; width: number; depth: number }[],
): string => {
  const itemList = availableItems
    .map((i) => `- ${i.name} (id: ${i.id}, ${i.width}cm x ${i.depth}cm)`)
    .join("\n");

  const existingNote = req.existingFurniture?.length
    ? `\nAlready placed: ${req.existingFurniture.join(", ")}. Do not duplicate these.`
    : "";

  return `You are an interior designer. Furnish a ${req.roomType} room (${req.width}cm x ${req.height}cm) in ${req.style} style.
${existingNote}

Available furniture items:
${itemList}

Return a JSON array of placements. Each placement must have:
- furnitureItemId: the exact id from the list above
- name: the furniture name
- x: horizontal position in cm from left edge (must fit within room width)
- y: vertical position in cm from top edge (must fit within room height)
- rotation: angle in degrees (0, 90, 180, or 270)

Rules:
- Only use items from the available list
- Items must not overlap
- Items must fit within the room dimensions
- Leave walkable paths (at least 60cm)
- Place items logically (bed against wall, desk near window area, etc.)

Respond ONLY with the JSON array, no other text.`;
};

export const furnishRoom = async (req: FurnishRequest, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    const categoryMap: Record<string, string> = {
      living_room: "living-room",
      bedroom: "bedroom",
      kitchen: "kitchen",
      bathroom: "bathroom",
      office: "office",
      dining: "living-room",
      generic: "living-room",
    };

    const category = categoryMap[req.roomType] || "living-room";

    const availableItems = await prisma.furnitureItem.findMany({
      where: { category },
      select: { id: true, name: true, width: true, depth: true },
    });

    if (availableItems.length === 0) {
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "No furniture items available for this room type" })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const prompt = buildPrompt(req, availableItems);

    res.write(
      `data: ${JSON.stringify({ type: "status", message: "Analyzing room layout..." })}\n\n`,
    );

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interior designer AI. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      stream: true,
    });

    let fullContent = "";

    res.write(
      `data: ${JSON.stringify({ type: "status", message: "Generating furniture placements..." })}\n\n`,
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ type: "chunk", content: delta })}\n\n`);
      }
    }

    let suggestions: FurnitureSuggestion[] = [];
    try {
      const jsonMatch = fullContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch {
      logger.error("Failed to parse AI furniture suggestions", { content: fullContent });
      res.write(
        `data: ${JSON.stringify({ type: "error", message: "Failed to parse AI response" })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const validItemIds = new Set(availableItems.map((i) => i.id));
    const validSuggestions = suggestions.filter(
      (s) =>
        validItemIds.has(s.furnitureItemId) &&
        s.x >= 0 &&
        s.x <= req.width &&
        s.y >= 0 &&
        s.y <= req.height,
    );

    res.write(`data: ${JSON.stringify({ type: "suggestions", placements: validSuggestions })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    logger.error("AI furnish room failed", { error: err });
    res.write(`data: ${JSON.stringify({ type: "error", message: "AI service error" })}\n\n`);
    res.write("data: [DONE]\n\n");
    res.end();
  }
};
