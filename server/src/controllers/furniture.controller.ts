import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../types";
import { validated } from "../middleware/validate";
import {
  listFurnitureSchema,
  placeFurnitureSchema,
  updatePlacementSchema,
  removePlacementSchema,
} from "../schemas/furniture.schema";
import * as furnitureService from "../services/furniture.service";

export const listItems = async (req: Request, res: Response) => {
  const { query } = validated(req, listFurnitureSchema);
  const items = await furnitureService.listFurnitureItems(query);
  res.json(items);
};

export const place = async (req: Request, res: Response) => {
  const { body } = validated(req, placeFurnitureSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const placement = await furnitureService.placeFurniture(body, userId);

  if (!placement) {
    res.status(404).json({ error: "Design or furniture item not found" });
    return;
  }

  res.status(201).json(placement);
};

export const updatePlacement = async (req: Request, res: Response) => {
  const { params, body } = validated(req, updatePlacementSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const placement = await furnitureService.updatePlacement(params.id, body, userId);

  if (!placement) {
    res.status(404).json({ error: "Placement not found" });
    return;
  }

  res.json(placement);
};

export const removePlacement = async (req: Request, res: Response) => {
  const { params } = validated(req, removePlacementSchema);
  const { userId } = (req as AuthenticatedRequest).auth!;
  const deleted = await furnitureService.removePlacement(params.id, userId);

  if (!deleted) {
    res.status(404).json({ error: "Placement not found" });
    return;
  }

  res.json({ success: true });
};
