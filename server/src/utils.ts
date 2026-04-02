import type { Design, Room, FurnitureItem, PlacedFurniture, User } from "@prisma/client";

type DesignWithRelations = Design & {
  rooms?: Room[];
  furniture?: (PlacedFurniture & { furnitureItem?: FurnitureItem })[];
  user?: User;
};

type PlacedFurnitureWithItem = PlacedFurniture & {
  furnitureItem?: FurnitureItem;
};

export const serializeDate = (date: Date): string => date.toISOString();

export const serializeFurnitureItem = (item: FurnitureItem) => ({
  id: item.id,
  name: item.name,
  category: item.category,
  width: item.width,
  height: item.height,
  depth: item.depth,
  color: item.color,
  icon: item.icon,
  description: item.description,
  isDefault: item.isDefault,
});

export const serializePlacement = (placement: PlacedFurnitureWithItem) => ({
  id: placement.id,
  x: placement.x,
  y: placement.y,
  rotation: placement.rotation,
  scaleX: placement.scaleX,
  scaleY: placement.scaleY,
  designId: placement.designId,
  furnitureItemId: placement.furnitureItemId,
  roomId: placement.roomId,
  furnitureItem: placement.furnitureItem
    ? serializeFurnitureItem(placement.furnitureItem)
    : undefined,
});

export const serializeRoom = (room: Room) => ({
  id: room.id,
  name: room.name,
  type: room.type,
  color: room.color,
  points: room.points,
  area: room.area,
  designId: room.designId,
});

export const serializeDesign = (design: DesignWithRelations) => ({
  id: design.id,
  name: design.name,
  description: design.description,
  thumbnail: design.thumbnail,
  canvasData: design.canvasData,
  width: design.width,
  height: design.height,
  isPublic: design.isPublic,
  userId: design.userId,
  createdAt: serializeDate(design.createdAt),
  updatedAt: serializeDate(design.updatedAt),
  rooms: design.rooms?.map(serializeRoom),
  furniture: design.furniture?.map(serializePlacement),
});
