import { z } from "zod";
import {
  canvasSchema,
  furnitureSchema,
  openingSchema,
  roomSchema,
  wallSchema,
} from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";

const action = z.literal("action");

const actionEventSchema = z.discriminatedUnion("actionType", [
  z.object({ type: action, actionType: z.literal("add_wall"), payload: wallSchema }),
  z.object({ type: action, actionType: z.literal("add_room"), payload: roomSchema }),
  z.object({ type: action, actionType: z.literal("place_furniture"), payload: furnitureSchema }),
  z.object({ type: action, actionType: z.literal("add_opening"), payload: openingSchema }),
  z.object({
    type: action,
    actionType: z.literal("remove_element"),
    payload: z.object({ elementId: z.string().min(1) }),
  }),
  z.object({ type: action, actionType: z.literal("clear_design"), payload: z.object({}) }),
  z.object({ type: action, actionType: z.literal("set_canvas"), payload: canvasSchema }),
]);

const streamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("tool_call"), name: z.string().min(1) }),
  z.object({ type: z.literal("tool_done"), name: z.string().min(1) }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export const chatEventSchema = z.union([streamEventSchema, actionEventSchema]);

export type ChatEvent = z.infer<typeof chatEventSchema>;
type ActionEvent = z.infer<typeof actionEventSchema>;

export const applyAction = (event: ActionEvent) => {
  const store = useEditorStore.getState();
  switch (event.actionType) {
    case "add_wall":
      return store.addWall(event.payload);
    case "add_room":
      return store.setRooms([...store.rooms, event.payload]);
    case "place_furniture":
      return store.addFurniture(event.payload);
    case "add_opening":
      return store.addOpening(event.payload);
    case "remove_element":
      return store.removeElement(event.payload.elementId);
    case "clear_design":
      return store.clearCanvas();
    case "set_canvas":
      return store.setCanvas(event.payload);
  }
};
