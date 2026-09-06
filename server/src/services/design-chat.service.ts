import { streamText, tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { Response } from "express";
import { randomUUID } from "crypto";
import { getDesignById, updateDesign } from "./design.service";
import { prisma } from "../lib/db";
import { logger } from "../lib/logger";
import { serializeFurnitureItem } from "../lib/serializers";
import {
  DEFAULTS,
  ROOM_USAGES,
  emptyCanvas,
  polygonArea,
  wallLength,
  type Canvas,
  type CatalogItem,
  type Furniture,
  type Opening,
  type Room,
  type Wall,
} from "../schemas/canvas.schema";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ToolResult = { summary: string; action?: { actionType: string; payload: object } };

const point = z.tuple([z.number().int(), z.number().int()]);

const rectToPolygon = (x: number, y: number, w: number, h: number): Room["polygon"] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const bounds = (walls: Wall[]) => {
  if (walls.length === 0) return null;
  const xs = walls.flatMap((w) => [w.from[0], w.to[0]]);
  const ys = walls.flatMap((w) => [w.from[1], w.to[1]]);
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};

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

  let canvas: Canvas = emptyCanvas();
  let catalog: CatalogItem[] = [];
  let designFetched = false;
  let canvasDirty = false;

  const itemById = (id: string) => catalog.find((c) => c.id === id);

  const catalogText = () =>
    catalog
      .map((c) => `${c.id} → ${c.name} (${c.size[0]}×${c.size[1]} mm, ${c.category})`)
      .join("\n");

  const makeOpening = (
    kind: Opening["kind"],
    wall: Wall,
    offset: number,
    width?: number,
    variant?: Opening["variant"],
  ): Opening => {
    const base = { id: randomUUID(), kind, wall: wall.id, offset: Math.round(offset) };
    return kind === "door"
      ? {
          ...base,
          width: width ?? DEFAULTS.door.width,
          height: DEFAULTS.door.height,
          variant: variant ?? "single",
          hinge: "left",
          swing: "in",
        }
      : {
          ...base,
          width: width ?? DEFAULTS.window.width,
          height: DEFAULTS.window.height,
          sill: DEFAULTS.window.sill,
        };
  };

  const tools = {
    fetch_canvas: tool({
      description:
        "Fetch the current floor plan — walls, openings, rooms, furniture — plus the furniture catalog. ALWAYS call this first so you know the current state and the valid furniture item ids.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        const [design, items] = await Promise.all([
          getDesignById(designId, { userId, email }),
          prisma.furnitureItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
        ]);

        if (!design) return { summary: "Design not found or access denied." };
        if (design.permission === "readonly") {
          return { summary: "You have view-only access to this design, so it cannot be changed." };
        }

        catalog = items.map(serializeFurnitureItem);
        canvas = design.canvasData as Canvas;
        designFetched = true;
        canvasDirty = false;

        const extent = bounds(canvas.walls);
        const size = extent ? `${extent.width}×${extent.height} mm` : "empty";

        if (
          canvas.walls.length === 0 &&
          canvas.rooms.length === 0 &&
          canvas.furniture.length === 0
        ) {
          return {
            summary: `Design "${design.name}" is empty. Ready to build.\n\nFurniture catalog (use the exact id):\n${catalogText()}`,
          };
        }

        return {
          summary: [
            `Design "${design.name}" (${size})`,
            `Walls: ${canvas.walls.length} (indexed 0–${canvas.walls.length - 1})`,
            `Rooms: ${canvas.rooms.map((r) => `"${r.name}" [${r.usage}]`).join(", ") || "none"}`,
            `Furniture: ${canvas.furniture.map((f) => itemById(f.item)?.name ?? f.item).join(", ") || "none"}`,
            `Openings: ${canvas.openings.filter((o) => o.kind === "door").length} doors, ${canvas.openings.filter((o) => o.kind === "window").length} windows`,
            `\nFurniture catalog (use the exact id):\n${catalogText()}`,
          ].join("\n"),
        };
      },
    }),

    set_canvas: tool({
      description:
        "Replace the ENTIRE floor plan in one atomic call. Use for any new design, full redesign or 'start over'. Plan every room and every piece of furniture before calling.",
      inputSchema: z.object({
        walls: z
          .array(z.object({ from: point, to: point, thickness: z.number().int().optional() }))
          .default([]),
        rooms: z
          .array(
            z.object({
              name: z.string(),
              usage: z.enum(ROOM_USAGES),
              x: z.number().int(),
              y: z.number().int(),
              width: z.number().int(),
              height: z.number().int(),
            }),
          )
          .default([]),
        furniture: z
          .array(
            z.object({
              item: z.string().describe("Exact catalog id from fetch_canvas, e.g. 'sofa'"),
              at: point.describe("CENTRE of the item in mm"),
              rotation: z.number().optional().describe("0, 90, 180 or 270"),
            }),
          )
          .default([]),
        openings: z
          .array(
            z.object({
              kind: z.enum(["door", "window"]),
              wallIndex: z.number().int().describe("0-based index into the walls array above"),
              offset: z
                .number()
                .int()
                .describe("mm from the wall's `from` end to the opening's centre"),
              width: z.number().int().optional(),
              variant: z.enum(["single", "double", "sliding"]).optional(),
            }),
          )
          .default([]),
      }),
      execute: async (params): Promise<ToolResult> => {
        if (!designFetched) return { summary: "Call fetch_canvas first to load the catalog." };

        const unknown = params.furniture.map((f) => f.item).filter((id) => !itemById(id));
        if (unknown.length > 0) {
          return {
            summary: `Unknown furniture ids: ${unknown.join(", ")}. Use ids from fetch_canvas.`,
          };
        }

        const walls: Wall[] = params.walls.map((w) => ({
          id: randomUUID(),
          from: w.from,
          to: w.to,
          thickness: w.thickness ?? DEFAULTS.wallThickness,
          height: DEFAULTS.wallHeight,
        }));

        const rooms: Room[] = params.rooms.map((r) => ({
          id: randomUUID(),
          name: r.name,
          usage: r.usage,
          polygon: rectToPolygon(r.x, r.y, r.width, r.height),
        }));

        const furniture: Furniture[] = params.furniture.map((f) => ({
          id: randomUUID(),
          item: f.item,
          at: f.at,
          rotation: f.rotation ?? 0,
        }));

        const openings: Opening[] = params.openings
          .filter((o) => walls[o.wallIndex])
          .map((o) => makeOpening(o.kind, walls[o.wallIndex]!, o.offset, o.width, o.variant));

        canvas = { ...emptyCanvas(), walls, openings, rooms, furniture };
        canvasDirty = true;

        return {
          summary: `Canvas set: ${walls.length} walls, ${rooms.length} rooms, ${furniture.length} furniture, ${openings.length} openings.`,
          action: { actionType: "set_canvas", payload: canvas },
        };
      },
    }),

    edit_canvas: tool({
      description: `Apply one targeted edit. Use for small changes only; use set_canvas for redesigns. Operations:
- add_wall: from, to required; thickness optional
- add_room: name, usage, x, y, width, height required
- place_furniture: item (catalog id), at required; rotation optional
- add_opening: kind, wallIndex, offset required; width, variant optional
- remove_element: collection (walls|openings|rooms|furniture), elementId required
- clear_all: removes everything`,
      inputSchema: z.object({
        operation: z.enum([
          "add_wall",
          "add_room",
          "place_furniture",
          "add_opening",
          "remove_element",
          "clear_all",
        ]),
        from: point.optional(),
        to: point.optional(),
        thickness: z.number().int().optional(),
        name: z.string().optional(),
        usage: z.enum(ROOM_USAGES).optional(),
        x: z.number().int().optional(),
        y: z.number().int().optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
        item: z.string().optional(),
        at: point.optional(),
        rotation: z.number().optional(),
        kind: z.enum(["door", "window"]).optional(),
        wallIndex: z.number().int().optional(),
        offset: z.number().int().optional(),
        variant: z.enum(["single", "double", "sliding"]).optional(),
        collection: z.enum(["walls", "openings", "rooms", "furniture"]).optional(),
        elementId: z.string().optional(),
      }),
      execute: async (params): Promise<ToolResult> => {
        if (!designFetched) return { summary: "Call fetch_canvas first before editing." };

        switch (params.operation) {
          case "add_wall": {
            if (!params.from || !params.to) return { summary: "add_wall requires from and to" };
            const wall: Wall = {
              id: randomUUID(),
              from: params.from,
              to: params.to,
              thickness: params.thickness ?? DEFAULTS.wallThickness,
              height: DEFAULTS.wallHeight,
            };
            canvas.walls.push(wall);
            canvasDirty = true;
            return {
              summary: `Wall added (${wall.from}) → (${wall.to}). Total walls: ${canvas.walls.length}`,
              action: { actionType: "add_wall", payload: wall },
            };
          }

          case "add_room": {
            const { name, usage, x, y, width, height } = params;
            if (!name || !usage || x == null || y == null || width == null || height == null) {
              return { summary: "add_room requires name, usage, x, y, width, height" };
            }
            const room: Room = {
              id: randomUUID(),
              name,
              usage,
              polygon: rectToPolygon(x, y, width, height),
            };
            canvas.rooms.push(room);
            canvasDirty = true;
            return {
              summary: `Room "${name}" (${usage}) added at (${x},${y}) size ${width}×${height} mm`,
              action: { actionType: "add_room", payload: room },
            };
          }

          case "place_furniture": {
            const { item, at, rotation } = params;
            if (!item || !at) return { summary: "place_furniture requires item and at" };
            const entry = itemById(item);
            if (!entry) {
              return {
                summary: `Unknown item "${item}". Valid ids: ${catalog.map((c) => c.id).join(", ")}`,
              };
            }
            const placed: Furniture = { id: randomUUID(), item, at, rotation: rotation ?? 0 };
            canvas.furniture.push(placed);
            canvasDirty = true;
            return {
              summary: `${entry.name} placed at (${at}) rotation=${rotation ?? 0}`,
              action: { actionType: "place_furniture", payload: placed },
            };
          }

          case "add_opening": {
            const { kind, wallIndex, offset, width, variant } = params;
            if (!kind || wallIndex == null || offset == null) {
              return { summary: "add_opening requires kind, wallIndex and offset" };
            }
            const wall = canvas.walls[wallIndex];
            if (!wall) {
              return {
                summary: `No wall at index ${wallIndex}. Valid: 0–${canvas.walls.length - 1}`,
              };
            }
            const opening = makeOpening(kind, wall, offset, width, variant);
            canvas.openings.push(opening);
            canvasDirty = true;
            return {
              summary: `${kind} added on wall [${wallIndex}] at ${offset} mm`,
              action: { actionType: "add_opening", payload: opening },
            };
          }

          case "remove_element": {
            const { collection, elementId } = params;
            if (!collection || !elementId) {
              return { summary: "remove_element requires collection and elementId" };
            }
            const list = canvas[collection] as { id: string }[];
            const idx = list.findIndex((e) => e.id === elementId);
            if (idx === -1) return { summary: `No ${collection} entry with id ${elementId}` };
            list.splice(idx, 1);
            if (collection === "walls") {
              canvas.openings = canvas.openings.filter((o) => o.wall !== elementId);
            }
            canvasDirty = true;
            return {
              summary: `Removed from ${collection}`,
              action: { actionType: "remove_element", payload: { collection, elementId } },
            };
          }

          case "clear_all": {
            canvas = emptyCanvas();
            canvasDirty = true;
            return {
              summary: "Canvas cleared.",
              action: { actionType: "clear_design", payload: {} },
            };
          }
        }
      },
    }),

    review_canvas: tool({
      description:
        "Get an exact snapshot of the floor plan — positions, sizes and ids. Use to verify placement or to find an id before removing something.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        const { walls, rooms, furniture, openings } = canvas;
        if (walls.length === 0 && rooms.length === 0 && furniture.length === 0) {
          return { summary: "Canvas is empty." };
        }
        const parts = [
          walls.length &&
            `Walls (${walls.length}):\n` +
              walls
                .map((w, i) => `  [${i}] (${w.from})→(${w.to}) len=${wallLength(w)} id=${w.id}`)
                .join("\n"),
          rooms.length &&
            `Rooms (${rooms.length}):\n` +
              rooms
                .map(
                  (r) =>
                    `  "${r.name}" [${r.usage}] area=${Math.round(polygonArea(r.polygon) / 1e6)} m² id=${r.id}`,
                )
                .join("\n"),
          furniture.length &&
            `Furniture (${furniture.length}):\n` +
              furniture
                .map(
                  (f) =>
                    `  ${itemById(f.item)?.name ?? f.item} at (${f.at}) rot=${f.rotation} id=${f.id}`,
                )
                .join("\n"),
          openings.length &&
            `Openings (${openings.length}): ` +
              openings.map((o) => `${o.kind} on ${o.wall} @${o.offset}mm id=${o.id}`).join(", "),
        ].filter(Boolean);
        return { summary: parts.join("\n") };
      },
    }),

    save_canvas: tool({
      description:
        "Persist all changes. Always call this after editing — nothing is saved until you do.",
      inputSchema: z.object({}),
      execute: async (): Promise<ToolResult> => {
        if (!designFetched) return { summary: "Call fetch_canvas first before saving." };
        if (!canvasDirty) {
          return {
            summary:
              "Nothing to save — no changes were made this turn. Saving now would overwrite edits other people may have made since the canvas was fetched.",
          };
        }
        try {
          const saved = await updateDesign(designId, { canvasData: canvas }, userId, email);
          if (!saved)
            return { summary: "Save failed: you do not have permission to edit this design." };
          canvasDirty = false;
          return {
            summary: `Saved: ${canvas.walls.length} walls, ${canvas.rooms.length} rooms, ${canvas.furniture.length} furniture, ${canvas.openings.length} openings.`,
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

## UNITS AND COORDINATES
- Everything is in integer MILLIMETRES. 1000 mm = 1 m.
- Origin (0, 0) is the top-left. X increases rightward, Y increases downward.
- Points are [x, y] pairs. A wall runs from its \`from\` point to its \`to\` point.
- Furniture \`at\` is the CENTRE of the item. Catalog size is [width, depth, height]: an item of
  width fw and depth fd at [x, y] spans x-fw/2 .. x+fw/2 and y-fd/2 .. y+fd/2.
- An opening sits on a wall at \`offset\` mm from that wall's \`from\` end (its centre).

## TOOLS
- fetch_canvas   → ALWAYS call first. Returns current state + the catalog of item ids.
- set_canvas     → Replace the whole plan atomically. Use for new designs or major rebuilds.
- edit_canvas    → Add/remove single elements. Small tweaks only.
- review_canvas  → Exact positions and ids. Use before removals.
- save_canvas    → Persist. ALWAYS call last.

## WORKFLOW
New/full design:  fetch_canvas → set_canvas → save_canvas
Small change:     fetch_canvas → edit_canvas → save_canvas

## DESIGN RULES

### Rooms
1. Start rooms near [400, 400]. Adjacent rooms SHARE a wall — room A's right wall is room B's left wall.
2. Rooms tile with no gaps. Typical sizes (mm):
   Living 3500–5000 × 3000–4500 · Bedroom 3000–4000 × 2800–3800 · Kitchen 2500–3500 × 2500–3500
   Bathroom 1800–2500 × 2000–2800 · Office 2500–3500 × 2500–3500 · Dining 3000–4000 × 2800–3500
   Hallway 800–1200 wide

### Walls
For a room at (rx, ry) of size (rw, rh) create 4 walls:
  Top    [rx, ry] → [rx+rw, ry]
  Right  [rx+rw, ry] → [rx+rw, ry+rh]
  Bottom [rx+rw, ry+rh] → [rx, ry+rh]
  Left   [rx, ry+rh] → [rx, ry]
Never emit two walls at the same position — shared boundaries are ONE wall.

### Furniture — CRITICAL
PAD = 250 (minimum mm from any wall to a furniture edge)
1. FIT: an item (fw × fd) fits a room (rw × rh) only if fw ≤ rw - 2·PAD and fd ≤ rh - 2·PAD. Skip items that do not fit.
2. PLACEMENT (coordinates are CENTRES):
   • Against top wall:    y = ry + PAD + fd/2,        x = rx + rw/2
   • Against bottom wall: y = ry + rh - PAD - fd/2,   x = rx + rw/2
   • Against left wall:   x = rx + PAD + fw/2,        y = ry + rh/2
   • Against right wall:  x = rx + rw - PAD - fw/2,   y = ry + rh/2
   • Centred:             x = rx + rw/2,              y = ry + rh/2
   SANITY CHECK every item: x-fw/2 ≥ rx+PAD, x+fw/2 ≤ rx+rw-PAD, y-fd/2 ≥ ry+PAD, y+fd/2 ≤ ry+rh-PAD.
3. NO OVERLAP: A and B overlap when |A.x-B.x| < (A.w+B.w)/2 + 200 AND |A.y-B.y| < (A.d+B.d)/2 + 200. Shift or skip.
4. ROTATION 0 = width along X. Rotation 90 swaps width and depth.

### Furnishing guide
Living: sofa on a wall, coffee-table in front, tv-stand opposite · Bedroom: bed on the top wall, nightstand beside it, wardrobe opposite · Kitchen: refrigerator in a corner, stove beside it, kitchen-island centred if it fits · Bathroom: toilet on a wall, sink beside, bathtub or shower along the longest wall · Office: office-desk on a wall, office-chair in front, bookcase on a side wall · Dining: dining-table centred, dining-chairs around it.

### Openings
Every room needs at least one door — on a shared wall for interior rooms, an exterior wall for the entry. offset = wall length / 2 puts it in the middle. Windows go on exterior walls.

## ITEM IDS
Use the exact catalog ids from fetch_canvas ("sofa", "double-bed", …). Never invent one.

## EXAMPLE — living room at (400, 400) size 4200×3600
  sofa (2000×900):          at [400+2100, 400+3600-250-450] = [2500, 3300]   (bottom wall)
  coffee-table (1200×600):  at [2500, 3300-450-200-300]      = [2500, 2350]   (in front of sofa)
  tv-stand (1500×400):      at [2500, 400+250+200]           = [2500, 850]    (top wall)
Check the sofa: x 1500..3500 inside 650..4350, y 2850..3750 inside 650..3750. Good.`;

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
