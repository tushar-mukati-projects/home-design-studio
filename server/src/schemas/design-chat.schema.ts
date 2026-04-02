import { z } from "zod";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const pointSchema = z.object({ x: z.number(), y: z.number() });

const wallSchema = z.object({
  id: z.string(),
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  thickness: z.number().optional(),
  color: z.string().optional(),
});

const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  color: z.string().optional(),
  points: z.array(pointSchema),
  area: z.number().optional(),
});

const furnitureItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number().optional(),
  color: z.string().optional(),
});

const placedFurnitureSchema = z.object({
  id: z.string(),
  furnitureItemId: z.string(),
  furnitureItem: furnitureItemSchema,
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
});

const doorSchema = z.object({
  id: z.string(),
  wallId: z.string(),
  position: z.number(),
  width: z.number().optional(),
  type: z.string().optional(),
});

const windowSchema = z.object({
  id: z.string(),
  wallId: z.string(),
  position: z.number(),
  width: z.number().optional(),
});

export const designChatSchema = z.object({
  body: z.object({
    messages: z.array(messageSchema).min(1),
    canvasState: z.object({
      walls: z.array(wallSchema).default([]),
      rooms: z.array(roomSchema).default([]),
      furniture: z.array(placedFurnitureSchema).default([]),
      doors: z.array(doorSchema).default([]),
      windows: z.array(windowSchema).default([]),
    }),
  }),
});
