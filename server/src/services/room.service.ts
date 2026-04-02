import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { serializeRoom } from "../utils";

interface Point {
  x: number;
  y: number;
}

interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const EPSILON = 0.5;

const pointsEqual = (a: Point, b: Point): boolean =>
  Math.abs(a.x - b.x) < EPSILON && Math.abs(a.y - b.y) < EPSILON;

const normalizePoint = (p: Point): string =>
  `${Math.round(p.x * 10) / 10},${Math.round(p.y * 10) / 10}`;

const calculatePolygonArea = (points: Point[]): number => {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
};

const detectEnclosedPolygons = (walls: WallSegment[]): Point[][] => {
  const adjacency = new Map<string, { point: Point; neighbors: Point[] }>();

  for (const wall of walls) {
    const p1: Point = { x: wall.x1, y: wall.y1 };
    const p2: Point = { x: wall.x2, y: wall.y2 };
    const k1 = normalizePoint(p1);
    const k2 = normalizePoint(p2);

    if (!adjacency.has(k1)) adjacency.set(k1, { point: p1, neighbors: [] });
    if (!adjacency.has(k2)) adjacency.set(k2, { point: p2, neighbors: [] });

    const node1 = adjacency.get(k1)!;
    const node2 = adjacency.get(k2)!;

    if (!node1.neighbors.some((n) => pointsEqual(n, p2))) {
      node1.neighbors.push(p2);
    }
    if (!node2.neighbors.some((n) => pointsEqual(n, p1))) {
      node2.neighbors.push(p1);
    }
  }

  for (const [, node] of adjacency) {
    node.neighbors.sort((a, b) => {
      const angleA = Math.atan2(a.y - node.point.y, a.x - node.point.x);
      const angleB = Math.atan2(b.y - node.point.y, b.x - node.point.x);
      return angleA - angleB;
    });
  }

  const usedEdges = new Set<string>();
  const polygons: Point[][] = [];

  const edgeKey = (from: Point, to: Point): string =>
    `${normalizePoint(from)}->${normalizePoint(to)}`;

  for (const [, startNode] of adjacency) {
    for (const firstNeighbor of startNode.neighbors) {
      const ek = edgeKey(startNode.point, firstNeighbor);
      if (usedEdges.has(ek)) continue;

      const polygon: Point[] = [startNode.point];
      let current = startNode.point;
      let next = firstNeighbor;
      let valid = true;

      for (let step = 0; step < 100; step++) {
        const currentEdge = edgeKey(current, next);
        if (usedEdges.has(currentEdge)) {
          valid = false;
          break;
        }

        polygon.push(next);

        if (polygon.length > 2 && pointsEqual(next, startNode.point)) {
          polygon.pop();
          break;
        }

        const nextKey = normalizePoint(next);
        const nextNode = adjacency.get(nextKey);
        if (!nextNode || nextNode.neighbors.length < 2) {
          valid = false;
          break;
        }

        const incomingAngle = Math.atan2(current.y - next.y, current.x - next.x);
        let bestNeighbor: Point | null = null;
        let smallestAngle = Infinity;

        for (const neighbor of nextNode.neighbors) {
          if (pointsEqual(neighbor, current)) continue;
          let angle = Math.atan2(neighbor.y - next.y, neighbor.x - next.x) - incomingAngle;
          if (angle <= 0) angle += 2 * Math.PI;
          if (angle < smallestAngle) {
            smallestAngle = angle;
            bestNeighbor = neighbor;
          }
        }

        if (!bestNeighbor) {
          valid = false;
          break;
        }

        current = next;
        next = bestNeighbor;
      }

      if (valid && polygon.length >= 3) {
        const area = calculatePolygonArea(polygon);
        if (area > 100) {
          for (let i = 0; i < polygon.length; i++) {
            const from = polygon[i];
            const to = polygon[(i + 1) % polygon.length];
            usedEdges.add(edgeKey(from, to));
          }
          polygons.push(polygon);
        }
      }
    }
  }

  return polygons;
};

export const createRoom = async (
  data: {
    designId: string;
    name?: string;
    type?: string;
    color?: string;
    points: Point[];
  },
  userId: string,
) => {
  const design = await prisma.design.findFirst({
    where: { id: data.designId, userId },
  });

  if (!design) return null;

  const area = calculatePolygonArea(data.points);

  const room = await prisma.room.create({
    data: {
      designId: data.designId,
      name: data.name ?? "Room",
      type: data.type ?? "generic",
      color: data.color ?? "#E5E7EB",
      points: data.points as unknown as Prisma.InputJsonValue,
      area,
    },
  });

  return serializeRoom(room);
};

export const updateRoom = async (
  id: string,
  data: {
    name?: string;
    type?: string;
    color?: string;
    points?: Point[];
  },
  userId: string,
) => {
  const existing = await prisma.room.findFirst({
    where: {
      id,
      design: { userId },
    },
  });

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.type !== undefined) updateData.type = data.type;
  if (data.color !== undefined) updateData.color = data.color;
  if (data.points !== undefined) {
    updateData.points = data.points;
    updateData.area = calculatePolygonArea(data.points);
  }

  const room = await prisma.room.update({
    where: { id },
    data: updateData,
  });

  return serializeRoom(room);
};

export const deleteRoom = async (id: string, userId: string) => {
  const existing = await prisma.room.findFirst({
    where: {
      id,
      design: { userId },
    },
  });

  if (!existing) return false;

  await prisma.room.delete({ where: { id } });
  return true;
};

export const detectRooms = async (designId: string, walls: WallSegment[], userId: string) => {
  const design = await prisma.design.findFirst({
    where: { id: designId, userId },
  });

  if (!design) return null;

  const polygons = detectEnclosedPolygons(walls);

  await prisma.room.deleteMany({ where: { designId } });

  const rooms = await Promise.all(
    polygons.map((points, index) =>
      prisma.room.create({
        data: {
          designId,
          name: `Room ${index + 1}`,
          type: "generic",
          color: "#E5E7EB",
          points: points as unknown as Prisma.InputJsonValue,
          area: calculatePolygonArea(points),
        },
      }),
    ),
  );

  return rooms.map(serializeRoom);
};
