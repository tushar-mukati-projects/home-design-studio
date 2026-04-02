import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import { validated } from "../middleware/validate";
import {
  createRoomSchema,
  updateRoomSchema,
  deleteRoomSchema,
  detectRoomsSchema,
} from "../schemas/room.schema";
import * as roomService from "../services/room.service";

export const create = async (req: Request, res: Response) => {
  const { body } = validated(req, createRoomSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const room = await roomService.createRoom(body, userId);

  if (!room) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.status(201).json(room);
};

export const update = async (req: Request, res: Response) => {
  const { params, body } = validated(req, updateRoomSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const room = await roomService.updateRoom(params.id, body, userId);

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json(room);
};

export const remove = async (req: Request, res: Response) => {
  const { params } = validated(req, deleteRoomSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const deleted = await roomService.deleteRoom(params.id, userId);

  if (!deleted) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json({ success: true });
};

export const detectRooms = async (req: Request, res: Response) => {
  const { body } = validated(req, detectRoomsSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const rooms = await roomService.detectRooms(body.designId, body.walls, userId);

  if (!rooms) {
    res.status(404).json({ error: "Design not found" });
    return;
  }

  res.json(rooms);
};
