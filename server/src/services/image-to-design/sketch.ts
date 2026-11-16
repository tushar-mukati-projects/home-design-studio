import { randomUUID } from "crypto";
import { z } from "zod";
import { FURNITURE_CATALOG } from "../../lib/seed-data/furniture";
import {
  DOOR_VARIANTS,
  ROOM_USAGES,
  emptyCanvas,
  newOpening,
  newWall,
  wallLength,
  type Canvas,
  type Furniture,
  type Opening,
  type Room,
  type Vec2,
  type Wall,
} from "../../shared/canvas";

const PX_TO_MM = 10;
const DEFAULT_ROOM_NAME = "Room";

const sketchPoint = z.object({ x: z.number(), y: z.number() });
const onWallSchema = z.object({ wallIndex: z.number().int(), position: z.number() });

export const sketchSchema = z.object({
  walls: z.array(z.object({ x1: z.number(), y1: z.number(), x2: z.number(), y2: z.number() })),
  doors: z.array(onWallSchema.extend({ type: z.string().optional() })).default([]),
  windows: z.array(onWallSchema).default([]),
  rooms: z
    .array(
      z.object({
        name: z.string().min(1).catch(DEFAULT_ROOM_NAME),
        type: z.string().optional(),
        points: z.array(sketchPoint),
      }),
    )
    .default([]),
  furniture: z
    .array(
      z.object({
        name: z.string().optional(),
        x: z.number(),
        y: z.number(),
        rotation: z.number().catch(0),
      }),
    )
    .default([]),
});

type Sketch = z.infer<typeof sketchSchema>;
type SketchWall = Sketch["walls"][number];
type SketchDoor = Sketch["doors"][number];
type SketchWindow = Sketch["windows"][number];
type SketchRoom = Sketch["rooms"][number];
type SketchFurniture = Sketch["furniture"][number];
type WallHit = { wall: string; offset: number };

export const toCanvas = (sketch: Sketch): Canvas => {
  const walls = sketch.walls.map(sketchWall);
  const rooms = sketch.rooms.filter((r) => r.points.length >= 3).map(sketchRoom);
  return {
    ...emptyCanvas(),
    walls,
    openings: [
      ...sketch.doors.flatMap((d) => sketchDoor(walls, d)),
      ...sketch.windows.flatMap((w) => sketchWindow(walls, w)),
    ],
    rooms,
    furniture: sketch.furniture.flatMap((f) => sketchFurniture(rooms, f)),
  };
};

const mm = (px: number) => Math.round(px * PX_TO_MM);

const sketchWall = (w: SketchWall): Wall => newWall([mm(w.x1), mm(w.y1)], [mm(w.x2), mm(w.y2)]);

const onWall = (walls: Wall[], { wallIndex, position }: SketchWindow): WallHit | null => {
  const wall = walls[wallIndex];
  if (!wall) return null;
  const along = Math.max(0, Math.min(1, position));
  return { wall: wall.id, offset: Math.round(along * wallLength(wall)) };
};

const sketchDoor = (walls: Wall[], door: SketchDoor): Opening[] => {
  const hit = onWall(walls, door);
  if (!hit) return [];
  const variant = DOOR_VARIANTS.find((v) => v === door.type) ?? "single";
  return [{ ...newOpening("door", hit.wall, hit.offset), variant }];
};

const sketchWindow = (walls: Wall[], window: SketchWindow): Opening[] => {
  const hit = onWall(walls, window);
  return hit ? [newOpening("window", hit.wall, hit.offset)] : [];
};

const sketchRoom = (room: SketchRoom): Room => ({
  id: randomUUID(),
  name: room.name,
  usage: ROOM_USAGES.find((u) => u === room.type) ?? "generic",
  polygon: room.points.map((p): Vec2 => [mm(p.x), mm(p.y)]),
});

const sketchFurniture = (rooms: Room[], piece: SketchFurniture): Furniture[] => {
  const wanted = (piece.name ?? "").toLowerCase();
  const item = FURNITURE_CATALOG.find((i) => i.name.toLowerCase() === wanted);
  const at: Vec2 = [mm(piece.x), mm(piece.y)];
  if (!item || !insideAnyRoom(rooms, at)) return [];
  return [{ id: randomUUID(), item: item.id, at, rotation: piece.rotation }];
};

const insideAnyRoom = (rooms: Room[], [x, y]: Vec2): boolean =>
  rooms.some((room) => {
    const xs = room.polygon.map((p) => p[0]);
    const ys = room.polygon.map((p) => p[1]);
    return (
      x >= Math.min(...xs) && x <= Math.max(...xs) && y >= Math.min(...ys) && y <= Math.max(...ys)
    );
  });
