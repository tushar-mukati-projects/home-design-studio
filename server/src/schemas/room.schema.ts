import { z } from "zod";

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const createRoomSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    name: z.string().min(1).max(100).optional(),
    type: z.string().max(50).optional(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    points: z.array(pointSchema).min(3),
  }),
});

export const updateRoomSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      type: z.string().max(50).optional(),
      color: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/)
        .optional(),
      points: z.array(pointSchema).min(3).optional(),
    })
    .passthrough(),
});

export const deleteRoomSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const detectRoomsSchema = z.object({
  body: z.object({
    designId: z.string().uuid(),
    walls: z
      .array(
        z.object({
          x1: z.number(),
          y1: z.number(),
          x2: z.number(),
          y2: z.number(),
        }),
      )
      .min(3),
  }),
});
