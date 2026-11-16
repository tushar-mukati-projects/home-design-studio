import { z } from "zod";
import { CANVAS_COLLECTIONS, DOOR_VARIANTS, OPENING_KINDS, ROOM_USAGES } from "../../shared/canvas";

const point = z.tuple([z.number().int(), z.number().int()]);

export const setCanvasInputSchema = z.object({
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
        kind: z.enum(OPENING_KINDS),
        wallIndex: z.number().int().describe("0-based index into the walls array above"),
        offset: z.number().int().describe("mm from the wall's `from` end to the opening's centre"),
        width: z.number().int().optional(),
        variant: z.enum(DOOR_VARIANTS).optional(),
      }),
    )
    .default([]),
});

export const editCanvasInputSchema = z.object({
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
  kind: z.enum(OPENING_KINDS).optional(),
  wallIndex: z.number().int().optional(),
  offset: z.number().int().optional(),
  variant: z.enum(DOOR_VARIANTS).optional(),
  collection: z.enum(CANVAS_COLLECTIONS).optional(),
  elementId: z.string().optional(),
});

export type SetCanvasInput = z.infer<typeof setCanvasInputSchema>;
export type EditCanvasInput = z.infer<typeof editCanvasInputSchema>;
