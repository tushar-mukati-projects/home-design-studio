import { toast } from "sonner";
import { boundsOf, newId } from "@/lib/canvas";
import { QUICK_ADD_AT } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";
import type { Canvas, CatalogItem, Vec2 } from "@/shared/canvas";

type Placeable = Pick<Canvas, "walls" | "rooms" | "furniture">;

export const addToPlan = (item: CatalogItem, at: Vec2) => {
  useEditorStore.getState().addFurniture({ id: newId(), item: item.id, at, rotation: 0 });
  toast.success(`${item.name} added to the plan`);
};

export const quickAddPosition = (canvas: Placeable): Vec2 => {
  const bounds = boundsOf(canvas);
  if (!bounds) return QUICK_ADD_AT;
  return [Math.round((bounds.minX + bounds.maxX) / 2), Math.round((bounds.minY + bounds.maxY) / 2)];
};
