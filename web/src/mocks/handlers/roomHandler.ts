import { http, HttpResponse, delay } from "msw";
import { _designs } from "../store";
import { mockUrl } from "../config";
import type { Room, Wall } from "@/types";

const detectRoomsFromWalls = (walls: Wall[]): Room[] => {
  if (walls.length < 3) return [];

  const rooms: Room[] = [];
  const outerWalls = walls.filter((w) => w.thickness >= 14);

  if (outerWalls.length >= 4) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const w of outerWalls) {
      minX = Math.min(minX, w.x1, w.x2);
      minY = Math.min(minY, w.y1, w.y2);
      maxX = Math.max(maxX, w.x1, w.x2);
      maxY = Math.max(maxY, w.y1, w.y2);
    }

    const innerWalls = walls.filter((w) => w.thickness < 14);

    if (innerWalls.length === 0) {
      const widthM = (maxX - minX) / 100;
      const heightM = (maxY - minY) / 100;
      rooms.push({
        id: `room_${crypto.randomUUID().slice(0, 8)}`,
        name: "Room 1",
        type: "generic",
        color: "#52525b30",
        points: [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ],
        area: Math.round(widthM * heightM * 100) / 100,
      });
    } else {
      for (const iw of innerWalls) {
        const isVertical = Math.abs(iw.x1 - iw.x2) < 10;
        const isHorizontal = Math.abs(iw.y1 - iw.y2) < 10;

        if (isVertical) {
          const splitX = (iw.x1 + iw.x2) / 2;
          const splitYStart = Math.min(iw.y1, iw.y2);
          const splitYEnd = Math.max(iw.y1, iw.y2);

          const leftWidth = (splitX - minX) / 100;
          const leftHeight = (splitYEnd - splitYStart) / 100;
          rooms.push({
            id: `room_${crypto.randomUUID().slice(0, 8)}`,
            name: `Room ${rooms.length + 1}`,
            type: "generic",
            color: `hsl(${rooms.length * 60}, 40%, 50%, 0.2)`,
            points: [
              { x: minX, y: splitYStart },
              { x: splitX, y: splitYStart },
              { x: splitX, y: splitYEnd },
              { x: minX, y: splitYEnd },
            ],
            area: Math.round(leftWidth * leftHeight * 100) / 100,
          });

          const rightWidth = (maxX - splitX) / 100;
          rooms.push({
            id: `room_${crypto.randomUUID().slice(0, 8)}`,
            name: `Room ${rooms.length + 1}`,
            type: "generic",
            color: `hsl(${rooms.length * 60}, 40%, 50%, 0.2)`,
            points: [
              { x: splitX, y: splitYStart },
              { x: maxX, y: splitYStart },
              { x: maxX, y: splitYEnd },
              { x: splitX, y: splitYEnd },
            ],
            area: Math.round(rightWidth * leftHeight * 100) / 100,
          });
        }

        if (isHorizontal) {
          const splitY = (iw.y1 + iw.y2) / 2;
          const splitXStart = Math.min(iw.x1, iw.x2);
          const splitXEnd = Math.max(iw.x1, iw.x2);

          const topHeight = (splitY - minY) / 100;
          const topWidth = (splitXEnd - splitXStart) / 100;
          rooms.push({
            id: `room_${crypto.randomUUID().slice(0, 8)}`,
            name: `Room ${rooms.length + 1}`,
            type: "generic",
            color: `hsl(${rooms.length * 60}, 40%, 50%, 0.2)`,
            points: [
              { x: splitXStart, y: minY },
              { x: splitXEnd, y: minY },
              { x: splitXEnd, y: splitY },
              { x: splitXStart, y: splitY },
            ],
            area: Math.round(topHeight * topWidth * 100) / 100,
          });

          const bottomHeight = (maxY - splitY) / 100;
          rooms.push({
            id: `room_${crypto.randomUUID().slice(0, 8)}`,
            name: `Room ${rooms.length + 1}`,
            type: "generic",
            color: `hsl(${rooms.length * 60}, 40%, 50%, 0.2)`,
            points: [
              { x: splitXStart, y: splitY },
              { x: splitXEnd, y: splitY },
              { x: splitXEnd, y: maxY },
              { x: splitXStart, y: maxY },
            ],
            area: Math.round(bottomHeight * topWidth * 100) / 100,
          });
        }
      }
    }
  }

  return rooms;
};

export const roomHandlers = [
  http.post(mockUrl("/rooms"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as {
      designId: string;
      name: string;
      type?: string;
      color?: string;
      points: { x: number; y: number }[];
    };

    const design = _designs.find((d) => d.id === input.designId);
    if (!design) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const room: Room = {
      id: `room_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      type: input.type ?? "generic",
      color: input.color ?? "#52525b30",
      points: input.points,
      area: 0,
    };

    if (room.points.length >= 3) {
      let area = 0;
      for (let i = 0; i < room.points.length; i++) {
        const j = (i + 1) % room.points.length;
        area += room.points[i].x * room.points[j].y;
        area -= room.points[j].x * room.points[i].y;
      }
      room.area = Math.round((Math.abs(area) / 2 / 10000) * 100) / 100;
    }

    design.rooms.push(room);
    design.updatedAt = new Date().toISOString();

    return HttpResponse.json(room, { status: 201 });
  }),

  http.patch(mockUrl("/rooms/:id"), async ({ params, request }) => {
    await delay(200);
    const roomId = params.id as string;
    const updates = (await request.json()) as Partial<{
      name: string;
      type: string;
      color: string;
    }>;

    for (const design of _designs) {
      const room = design.rooms.find((r) => r.id === roomId);
      if (room) {
        if (updates.name !== undefined) room.name = updates.name;
        if (updates.type !== undefined) room.type = updates.type;
        if (updates.color !== undefined) room.color = updates.color;
        design.updatedAt = new Date().toISOString();
        return HttpResponse.json(room);
      }
    }

    return HttpResponse.json({ error: "Room not found" }, { status: 404 });
  }),

  http.delete(mockUrl("/rooms/:id"), async ({ params }) => {
    await delay(200);
    const roomId = params.id as string;

    for (const design of _designs) {
      const idx = design.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        design.rooms.splice(idx, 1);
        design.updatedAt = new Date().toISOString();
        return HttpResponse.json({ success: true });
      }
    }

    return HttpResponse.json({ error: "Room not found" }, { status: 404 });
  }),

  http.post(mockUrl("/rooms/detect"), async ({ request }) => {
    await delay(500);
    const input = (await request.json()) as {
      designId: string;
      walls: Wall[];
    };

    const design = _designs.find((d) => d.id === input.designId);
    if (!design) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const detectedRooms = detectRoomsFromWalls(input.walls);
    design.rooms = detectedRooms;
    design.updatedAt = new Date().toISOString();

    return HttpResponse.json(detectedRooms);
  }),
];
