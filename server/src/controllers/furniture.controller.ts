import { validated } from "../middleware/validate";
import { listFurnitureSchema } from "../schemas/furniture.schema";
import * as furnitureService from "../services/furniture.service";
import type { Request, Response } from "express";

export const listItems = async (req: Request, res: Response) => {
  const { query } = validated(req, listFurnitureSchema);
  res.json(await furnitureService.listFurnitureItems(query));
};
