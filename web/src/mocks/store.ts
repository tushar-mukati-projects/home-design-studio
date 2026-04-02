import { mockDesigns, mockFurnitureItems, mockUser } from "./data";
import type { Design, FurnitureItem, PlacedFurniture, Room } from "@/types";

export const _user = structuredClone(mockUser);
export const _designs: Design[] = structuredClone(mockDesigns);
export const _furnitureItems: FurnitureItem[] = structuredClone(mockFurnitureItems);

export const getDesignFurniture = (designId: string): PlacedFurniture[] => {
  const design = _designs.find((d) => d.id === designId);
  return design?.furniture ?? [];
};

export const getDesignRooms = (designId: string): Room[] => {
  const design = _designs.find((d) => d.id === designId);
  return design?.rooms ?? [];
};
