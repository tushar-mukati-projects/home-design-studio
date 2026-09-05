import { mockDesigns, mockFurnitureItems } from "./data";
import type { Design, FurnitureItem } from "@/types";

const normalize = (design: Design): Design => ({
  ...design,
  canvasData: {
    ...design.canvasData,
    rooms: design.canvasData?.rooms ?? design.rooms ?? [],
    furniture: design.canvasData?.furniture ?? design.furniture ?? [],
  },
});

export const _designs: Design[] = structuredClone(mockDesigns).map(normalize);
export const _furnitureItems: FurnitureItem[] = structuredClone(mockFurnitureItems);

export const serializeMockDesign = (design: Design): Design => ({
  ...design,
  rooms: design.canvasData?.rooms ?? [],
  furniture: design.canvasData?.furniture ?? [],
});
