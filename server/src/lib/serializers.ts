import type { Design, FurnitureItem } from "@prisma/client";
import type { Canvas, CatalogItem } from "../schemas/canvas.schema";

export const serializeDate = (date: Date): string => date.toISOString();

export const serializeFurnitureItem = (item: FurnitureItem): CatalogItem => ({
  id: item.id,
  name: item.name,
  category: item.category as CatalogItem["category"],
  size: item.size as CatalogItem["size"],
  color: item.color,
});

// rooms and furniture are derived from canvasData so they can never be a stale copy.
export const serializeDesign = (design: Design) => {
  const canvas = (design.canvasData ?? {}) as Partial<Canvas>;

  return {
    id: design.id,
    name: design.name,
    description: design.description,
    thumbnail: design.thumbnail,
    canvasData: design.canvasData,
    userId: design.userId,
    createdAt: serializeDate(design.createdAt),
    updatedAt: serializeDate(design.updatedAt),
    rooms: Array.isArray(canvas.rooms) ? canvas.rooms : [],
    furniture: Array.isArray(canvas.furniture) ? canvas.furniture : [],
  };
};

export const serializeDesignSummary = (design: Design) => {
  const { canvasData: _canvasData, ...rest } = serializeDesign(design);
  return rest;
};
