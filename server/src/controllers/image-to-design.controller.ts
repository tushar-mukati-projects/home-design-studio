import type { Request, Response } from "express";
import { httpError } from "../lib/http-error";
import * as imageToDesignService from "../services/image-to-design.service";

export const imageToDesign = async (req: Request, res: Response) => {
  if (!req.file) {
    throw httpError(400, "VALIDATION_FAILED", { fields: { image: ["No image file provided"] } });
  }
  await imageToDesignService.analyzeImage(req.file.buffer, req.file.mimetype, res);
};
