import OpenAI from "openai";
import type { Response } from "express";
import { config } from "../config";
import { logger } from "../logger";

if (!config.openaiApiKey) {
  throw new Error(
    "Missing OPENAI_API_KEY. Set OPENAI_API_KEY in the environment or in server/.env (see server/.env.example).",
  );
}

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

const SYSTEM_PROMPT = `You are an expert architectural floor plan analyzer. You convert images of floor plans, sketches, blueprints, or room photos into a structured JSON floor plan.

You MUST respond with valid JSON only — no markdown, no explanation, no extra text.

=== STEP-BY-STEP PROCESS (follow in order) ===

STEP 1: IDENTIFY OVERALL BOUNDING BOX
- Determine the total floor plan dimensions from the image.
- Choose a canvas between 800-1200px wide and 600-1000px tall.
- Map the real-world proportions onto this canvas. For example, a 40'x30' house → canvasWidth: 1000, canvasHeight: 750.

STEP 2: IDENTIFY ALL ROOMS AS NON-OVERLAPPING RECTANGLES
- List EVERY room visible in the plan. Do NOT skip any room, closet, or washroom.
- For each room, estimate its proportional position and size as a percentage of the total floor plan width and height.
  Example: "Master Bedroom occupies x: 0%-40%, y: 0%-50% of the plan"
- Convert each room's percentage bounds to pixel coordinates on the canvas:
  roomLeft = canvasWidth * xStartPercent
  roomTop = canvasHeight * yStartPercent
  roomRight = canvasWidth * xEndPercent
  roomBottom = canvasHeight * yEndPercent
- CRITICAL: Rooms MUST tile the floor plan like a grid. No two rooms may overlap. Adjacent rooms share exact boundary coordinates.

STEP 3: GENERATE WALLS FROM ROOM BOUNDARIES
- For each room rectangle, its four edges become wall candidates.
- WHERE TWO ROOMS SHARE A BOUNDARY, emit only ONE wall segment for that shared edge — never two overlapping walls.
- Walls along the outer perimeter of the house appear once.
- Each wall is a segment: { x1, y1, x2, y2, thickness: 12 }.
- Walls must be axis-aligned (horizontal or vertical). Horizontal walls have y1 === y2. Vertical walls have x1 === x2.
- Wall endpoints MUST connect exactly — adjacent walls that meet at a corner must share the exact same coordinate at that corner.
- After generating walls, verify: every room's boundary is fully enclosed by walls on all four sides.

STEP 4: PLACE DOORS AND WINDOWS ON WALLS
- Doors go on interior walls (between rooms) and on exterior walls for entries.
- Windows go on exterior walls.
- "wallIndex" is the 0-based index into the walls array.
- "position" is 0.0-1.0 along the wall length (0.5 = center of the wall).
- Standard door width: 80. Standard window width: 100.

STEP 5: PLACE FURNITURE INSIDE ROOMS
- For each room, choose furniture appropriate to the room type.
- Furniture x,y is the CENTER of the item. It MUST be inside the room's rectangular bounds.
  Verify: roomLeft + margin < x < roomRight - margin AND roomTop + margin < y < roomBottom - margin (margin = half of furniture dimension + 10).
- Use ONLY these exact furniture names:
  Sofa, Armchair, Coffee Table, TV Stand, Bookshelf, Floor Lamp,
  Double Bed, Single Bed, Nightstand, Wardrobe, Dresser, Desk,
  Dining Table, Dining Chair,
  Kitchen Island, Refrigerator, Stove,
  Bathtub, Toilet, Sink, Shower,
  Office Desk, Office Chair, Filing Cabinet, Bookcase
- rotation: 0, 90, 180, or 270 degrees.
- Typical furniture sizes (width x height in px): Double Bed 140x200, Single Bed 100x200, Sofa 200x80, Dining Table 160x90, Desk 120x60, Toilet 45x60, Bathtub 80x170, Sink 50x40, Refrigerator 70x70, Stove 60x60, Wardrobe 120x55, Nightstand 45x45, Coffee Table 100x50, Armchair 80x80, TV Stand 120x40, Bookshelf 80x30, Dining Chair 45x45, Shower 90x90, Kitchen Island 120x70, Dresser 100x50, Office Desk 140x70, Office Chair 60x60, Filing Cabinet 45x60, Bookcase 90x35, Floor Lamp 30x30.

=== COORDINATE SYSTEM ===
- Origin (0,0) is top-left of the canvas.
- X increases rightward, Y increases downward.
- All values are in pixels.

=== ROOM TYPES ===
Use one of: living_room, bedroom, kitchen, bathroom, office, dining, hallway, garage, closet, laundry, generic

=== VALIDATION CHECKLIST (verify before outputting) ===
1. Every room from the image is present — do not omit any.
2. No two rooms overlap in their rectangular areas.
3. Adjacent rooms share exact boundary coordinates (e.g., Room A's right edge x === Room B's left edge x).
4. Shared boundaries produce exactly ONE wall, not two.
5. Walls form closed rectangles around every room.
6. Wall endpoints connect — corners share exact coordinates.
7. Every piece of furniture has its center inside its room.
8. Furniture names are from the allowed list above.
9. canvasWidth and canvasHeight are set and all coordinates fall within [0, canvasWidth] x [0, canvasHeight].

=== OUTPUT JSON SCHEMA ===
{
  "walls": [{ "x1": number, "y1": number, "x2": number, "y2": number, "thickness": 12 }],
  "doors": [{ "wallIndex": number, "position": number, "width": 80, "type": "single"|"double"|"sliding" }],
  "windows": [{ "wallIndex": number, "position": number, "width": 100 }],
  "rooms": [{ "name": string, "type": string, "points": [{ "x": number, "y": number }] }],
  "furniture": [{ "name": string, "x": number, "y": number, "rotation": number, "width": number, "height": number }],
  "canvasWidth": number,
  "canvasHeight": number
}

"rooms[].points" must be exactly 4 corner points of the room rectangle in order (top-left, top-right, bottom-right, bottom-left).`;

const USER_PROMPT = `Analyze this image and convert it into a structured floor plan design.

Follow this exact process:

1. COUNT every room/space in the image (bedrooms, bathrooms, kitchen, living areas, closets, hallways, etc.). List them all — do not skip any.

2. DETERMINE the overall floor plan proportions from the image. Choose a canvas size (800-1200px wide, 600-1000px tall) that matches the aspect ratio.

3. For each room, estimate what percentage of the total width and height it occupies, and where it sits within the plan. Then convert those percentages to pixel coordinates to create non-overlapping rectangles.

4. Generate walls from the room rectangles:
   - Each room edge becomes a wall segment.
   - Where two rooms share a boundary, output only ONE wall for that shared edge.
   - Ensure wall endpoints connect at corners (same x,y coordinates).

5. Add doors on walls between rooms and on exterior walls for entries. Add windows on exterior walls.

6. Place furniture appropriate to each room type, using ONLY the allowed furniture names. Verify every furniture center point is inside its room.

If this is a photo rather than a floor plan, estimate the layout as a rectangular room with visible furniture.

Respond ONLY with the JSON object. No markdown fences, no explanation.`;

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

    logger.info("Raw AI image-to-design response", { content });

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

    const canvasWidth = design.canvasWidth || 1000;
    const canvasHeight = design.canvasHeight || 800;

    const SNAP_THRESHOLD = 5;

    const walls = design.walls
      .filter(
        (w) =>
          typeof w.x1 === "number" &&
          typeof w.y1 === "number" &&
          typeof w.x2 === "number" &&
          typeof w.y2 === "number",
      )
      .map((w) => ({
        x1: Math.round(w.x1),
        y1: Math.round(w.y1),
        x2: Math.round(w.x2),
        y2: Math.round(w.y2),
        thickness: w.thickness || 12,
      }));

    // Snap wall endpoints that are within SNAP_THRESHOLD of each other
    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const endpoints: Array<{
          wall: (typeof walls)[number];
          key: "x1" | "x2";
          yKey: "y1" | "y2";
        }> = [
          { wall: walls[i], key: "x1", yKey: "y1" },
          { wall: walls[i], key: "x2", yKey: "y2" },
        ];
        const targets: Array<{
          wall: (typeof walls)[number];
          key: "x1" | "x2";
          yKey: "y1" | "y2";
        }> = [
          { wall: walls[j], key: "x1", yKey: "y1" },
          { wall: walls[j], key: "x2", yKey: "y2" },
        ];
        for (const ep of endpoints) {
          for (const tg of targets) {
            const dx = Math.abs(ep.wall[ep.key] - tg.wall[tg.key]);
            const dy = Math.abs(ep.wall[ep.yKey] - tg.wall[tg.yKey]);
            if (dx <= SNAP_THRESHOLD && dy <= SNAP_THRESHOLD && (dx > 0 || dy > 0)) {
              // Snap the target endpoint to the source endpoint
              tg.wall[tg.key] = ep.wall[ep.key];
              tg.wall[tg.yKey] = ep.wall[ep.yKey];
            }
          }
        }
      }
    }

    const doors = (design.doors || [])
      .filter(
        (d) => typeof d.wallIndex === "number" && d.wallIndex >= 0 && d.wallIndex < walls.length,
      )
      .map((d) => ({
        wallIndex: d.wallIndex,
        position: Math.max(0, Math.min(1, d.position || 0.5)),
        width: d.width || 80,
        type: (["single", "double", "sliding"].includes(d.type) ? d.type : "single") as
          | "single"
          | "double"
          | "sliding",
      }));

    const windows = (design.windows || [])
      .filter(
        (w) => typeof w.wallIndex === "number" && w.wallIndex >= 0 && w.wallIndex < walls.length,
      )
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
        points: r.points.map((p: { x: number; y: number }) => ({
          x: Math.round(p.x),
          y: Math.round(p.y),
        })),
      }));

    // Compute room bounding boxes for furniture validation
    const roomBounds = rooms.map((r) => {
      const xs = r.points.map((p) => p.x);
      const ys = r.points.map((p) => p.y);
      return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
      };
    });

    const isInsideAnyRoom = (x: number, y: number): boolean => {
      return roomBounds.some((b) => x >= b.minX && x <= b.maxX && y >= b.minY && y <= b.maxY);
    };

    const furnitureItems = (design.furniture || [])
      .filter((f) => typeof f.x === "number" && typeof f.y === "number")
      .map((f) => ({
        name: f.name || "Furniture",
        x: Math.round(Math.max(0, Math.min(canvasWidth, f.x))),
        y: Math.round(Math.max(0, Math.min(canvasHeight, f.y))),
        rotation: f.rotation || 0,
        width: f.width || 60,
        height: f.height || 60,
      }))
      .filter((f) => {
        if (!isInsideAnyRoom(f.x, f.y)) {
          logger.warn("Furniture outside all rooms, discarding", { name: f.name, x: f.x, y: f.y });
          return false;
        }
        return true;
      });

    const result = {
      walls,
      doors,
      windows,
      rooms,
      furniture: furnitureItems,
      canvasWidth,
      canvasHeight,
    };

    sendEvent({
      type: "status",
      message: `Found ${walls.length} walls, ${rooms.length} rooms, ${furnitureItems.length} furniture items`,
    });
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
