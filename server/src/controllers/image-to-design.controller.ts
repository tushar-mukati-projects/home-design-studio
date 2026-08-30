import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../lib/types";
import * as imageToDesignService from "../services/image-to-design.service";

export const imageToDesign = async (req: Request, res: Response) => {
  const { userId } = (req as AuthenticatedRequest).auth!;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const file = (req as Request & { file?: Express.Multer.File }).file;

  if (!file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.mimetype)) {
    res.status(400).json({ error: "Invalid file type. Supported: JPEG, PNG, WebP, GIF" });
    return;
  }

  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    res.status(400).json({ error: "File too large. Maximum size: 20MB" });
    return;
  }

  try {
    await imageToDesignService.analyzeImage(file.buffer, file.mimetype, res);
  } catch {
    if (!res.headersSent) {
      res.status(500).json({ error: "Image analysis failed" });
    }
  }
};
