import { mockDesigns, mockFurnitureItems } from "./data";
import type { Design, CatalogItem } from "@/types";

export const _designs: Design[] = structuredClone(mockDesigns);
export const _furnitureItems: CatalogItem[] = structuredClone(mockFurnitureItems);

export const serializeMockDesign = (design: Design): Design => ({
  ...design,
  rooms: design.canvasData?.rooms ?? [],
  furniture: design.canvasData?.furniture ?? [],
});
