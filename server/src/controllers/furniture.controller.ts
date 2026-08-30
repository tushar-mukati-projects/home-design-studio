import type { Request, Response } from "express";
import { validated } from "../middleware/validate";
import { listFurnitureSchema } from "../schemas/furniture.schema";
import * as furnitureService from "../services/furniture.service";

export const listItems = async (req: Request, res: Response) => {
  const { query } = validated(req, listFurnitureSchema);
  const items = await furnitureService.listFurnitureItems(query);
  res.json(items);
};
