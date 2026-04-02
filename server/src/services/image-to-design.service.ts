import OpenAI from "openai";
import type { Response } from "express";
import { config } from "../config";
import { logger } from "../logger";

const openai = new OpenAI({ apiKey: config.openaiApiKey });

interface DesignWall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

interface DesignDoor {
  wallIndex: number;
  position: number;
  width: number;
  type: "single" | "double" | "sliding";
}

interface DesignWindow {
  wallIndex: number;
  position: number;
  width: number;
}

interface DesignRoom {
  name: string;
  type: string;
  points: { x: number; y: number }[];
}

interface DesignFurniture {
  name: string;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

interface GeneratedDesign {
  walls: DesignWall[];
  doors: DesignDoor[];
  windows: DesignWindow[];
  rooms: DesignRoom[];
  furniture: DesignFurniture[];
  canvasWidth: number;
  canvasHeight: number;
}

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. You analyze images of rooms, floor plans, sketches, or blueprints and convert them into a structured floor plan design.

You MUST respond with valid JSON only — no markdown, no explanation, no extra text.

The coordinate system:
- Origin (0,0) is at the top-left corner of the canvas
- X increases to the right, Y increases downward
- All measurements are in pixels where 1 pixel ≈ 1cm
- Typical room: 300-600 pixels wide/tall
- Typical canvas: 800-1200 pixels

Wall rules:
- Walls are line segments defined by (x1,y1) → (x2,y2) endpoints
- Standard wall thickness: 12
- Walls should form closed rectangles/polygons for rooms
- Adjacent walls should share exact endpoints (snap to each other)

Door rules:
- "wallIndex" references the index (0-based) in the walls array
- "position" is 0.0-1.0 along the wall (0.5 = center)
- Standard door width: 80

Window rules:
- Same wallIndex/position system as doors
- Standard window width: 100

Room rules:
- Each room has a polygon of points that traces its floor area
- The points should follow wall inner edges
- "type" should be one of: living_room, bedroom, kitchen, bathroom, office, dining, hallway, garage, generic

Furniture:
- Common items: Sofa, Armchair, Coffee Table, TV Stand, Bookshelf, Double Bed, Single Bed, Nightstand, Wardrobe, Dresser, Desk, Dining Table, Dining Chair, Kitchen Island, Refrigerator, Stove, Bathtub, Toilet, Sink, Shower, Office Desk, Office Chair
- x,y is the CENTER position of the furniture
- rotation is in degrees (0, 90, 180, 270)
- width and height are the furniture dimensions in pixels/cm

Output JSON schema:
{
  "walls": [{ "x1": number, "y1": number, "x2": number, "y2": number, "thickness": 12 }],
  "doors": [{ "wallIndex": number, "position": number, "width": 80, "type": "single" }],
  "windows": [{ "wallIndex": number, "position": number, "width": 100 }],
  "rooms": [{ "name": string, "type": string, "points": [{ "x": number, "y": number }] }],
  "furniture": [{ "name": string, "x": number, "y": number, "rotation": number, "width": number, "height": number }],
  "canvasWidth": number,
  "canvasHeight": number
}`;

const USER_PROMPT = `Analyze this image and convert it into a floor plan design. 

If this is a photo of a room or space:
- Estimate the room layout and dimensions
- Identify visible walls, doors, windows
- Identify furniture and their approximate positions

If this is a floor plan, sketch, or blueprint:
- Extract the exact layout as closely as possible
- Identify all rooms, walls, doors, windows
- Identify labeled furniture or fixtures

Make the design proportional and realistic. Ensure walls connect properly to form enclosed rooms. Place furniture logically within rooms.

Respond ONLY with the JSON object.`;

export const analyzeImage = async (imageBuffer: Buffer, mimeType: string, res: Response) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent({ type: "status", message: "Analyzing your image..." });

    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    sendEvent({ type: "status", message: "Identifying walls, rooms, and furniture..." });

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
      sendEvent({ type: "error", message: "AI returned empty response" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    sendEvent({ type: "status", message: "Building your floor plan..." });

    let design: GeneratedDesign;
    try {
      design = JSON.parse(content);
    } catch {
      logger.error("Failed to parse AI image-to-design response", { content });
      sendEvent({ type: "error", message: "Failed to parse AI response" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    if (!design.walls || !Array.isArray(design.walls)) {
      sendEvent({ type: "error", message: "AI did not return valid wall data" });
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    const walls = design.walls
      .filter((w) => typeof w.x1 === "number" && typeof w.y1 === "number" && typeof w.x2 === "number" && typeof w.y2 === "number")
      .map((w) => ({
        x1: Math.round(w.x1),
        y1: Math.round(w.y1),
        x2: Math.round(w.x2),
        y2: Math.round(w.y2),
        thickness: w.thickness || 12,
      }));

    const doors = (design.doors || [])
      .filter((d) => typeof d.wallIndex === "number" && d.wallIndex >= 0 && d.wallIndex < walls.length)
      .map((d) => ({
        wallIndex: d.wallIndex,
        position: Math.max(0, Math.min(1, d.position || 0.5)),
        width: d.width || 80,
        type: (["single", "double", "sliding"].includes(d.type) ? d.type : "single") as "single" | "double" | "sliding",
      }));

    const windows = (design.windows || [])
      .filter((w) => typeof w.wallIndex === "number" && w.wallIndex >= 0 && w.wallIndex < walls.length)
      .map((w) => ({
        wallIndex: w.wallIndex,
        position: Math.max(0, Math.min(1, w.position || 0.5)),
        width: w.width || 100,
      }));

    const rooms = (design.rooms || [])
      .filter((r) => r.points && Array.isArray(r.points) && r.points.length >= 3)
      .map((r) => ({
        name: r.name || "Room",
        type: r.type || "generic",
        points: r.points.map((p: { x: number; y: number }) => ({ x: Math.round(p.x), y: Math.round(p.y) })),
      }));

    const furnitureItems = (design.furniture || [])
      .filter((f) => typeof f.x === "number" && typeof f.y === "number")
      .map((f) => ({
        name: f.name || "Furniture",
        x: Math.round(f.x),
        y: Math.round(f.y),
        rotation: f.rotation || 0,
        width: f.width || 60,
        height: f.height || 60,
      }));

    const result = {
      walls,
      doors,
      windows,
      rooms,
      furniture: furnitureItems,
      canvasWidth: design.canvasWidth || 1000,
      canvasHeight: design.canvasHeight || 800,
    };

    sendEvent({ type: "status", message: `Found ${walls.length} walls, ${rooms.length} rooms, ${furnitureItems.length} furniture items` });
    sendEvent({ type: "result", design: result });
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err) {
    logger.error("Image-to-design analysis failed", { error: err });
    sendEvent({ type: "error", message: "Failed to analyze image. Please try again." });
    res.write("data: [DONE]\n\n");
    res.end();
  }
};
