import { z } from "zod";

export const listFurnitureSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const placeFurnitureSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    furnitureItemId: z.string().uuid(),
    x: z.number(),
    y: z.number(),
    rotation: z.number().min(0).max(360).optional(),
    scaleX: z.number().positive().optional(),
    scaleY: z.number().positive().optional(),
    roomId: z.string().uuid().nullable().optional(),
  }),
});

export const updatePlacementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      x: z.number().optional(),
      y: z.number().optional(),
      rotation: z.number().min(0).max(360).optional(),
      scaleX: z.number().positive().optional(),
      scaleY: z.number().positive().optional(),
      roomId: z.string().uuid().nullable().optional(),
    })
    .passthrough(),
});

export const removePlacementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
