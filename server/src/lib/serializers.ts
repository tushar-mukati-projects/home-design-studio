import type { Design, FurnitureItem, User } from "@prisma/client";

type DesignWithRelations = Design & {
  user?: User;
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

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

// rooms and furniture are derived from canvasData so they can never be a stale copy.
export const serializeDesign = (design: DesignWithRelations) => {
  const canvas = (design.canvasData ?? {}) as Record<string, unknown>;

  return {
    id: design.id,
    name: design.name,
    description: design.description,
    thumbnail: design.thumbnail,
    canvasData: design.canvasData,
    width: design.width,
    height: design.height,
    userId: design.userId,
    createdAt: serializeDate(design.createdAt),
    updatedAt: serializeDate(design.updatedAt),
    rooms: asArray(canvas.rooms),
    furniture: asArray(canvas.furniture),
  };
};

// For list views: same shape minus canvasData, which a listing never reads and
// which duplicates the rooms/furniture already derived from it.
export const serializeDesignSummary = (design: DesignWithRelations) => {
  const { canvasData: _canvasData, ...rest } = serializeDesign(design);
  return rest;
};
