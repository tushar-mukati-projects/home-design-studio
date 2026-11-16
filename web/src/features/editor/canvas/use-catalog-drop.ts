import { useEffect, type RefObject } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { CATALOG_ITEM_DRAG_TYPE } from "@/lib/constants";
import { toVec } from "@/lib/canvas";
import { addToPlan } from "../furniture-catalog/add-to-plan";
import type Konva from "konva";

export const useCatalogDrop = (stageRef: RefObject<Konva.Stage | null>) => {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const container = stage.container();

    const handleDragOver = (e: DragEvent) => {
      if (
        useEditorStore.getState().canEdit &&
        e.dataTransfer?.types.includes(CATALOG_ITEM_DRAG_TYPE)
      ) {
        e.preventDefault();
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const s = useEditorStore.getState();
      const id = e.dataTransfer?.getData(CATALOG_ITEM_DRAG_TYPE);
      const item = s.catalog.find((c) => c.id === id);
      stage.setPointersPositions(e);
      const point = stage.getRelativePointerPosition();
      if (!item || !point) return;
      addToPlan(item, toVec(s.snapPoint(point)));
    };

    container.addEventListener("dragover", handleDragOver);
    container.addEventListener("drop", handleDrop);
    return () => {
      container.removeEventListener("dragover", handleDragOver);
      container.removeEventListener("drop", handleDrop);
    };
  }, [stageRef]);
};
