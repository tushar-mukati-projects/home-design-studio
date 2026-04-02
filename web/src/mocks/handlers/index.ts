import { userHandlers } from "./userHandler";
import { designHandlers } from "./designHandler";
import { furnitureHandlers } from "./furnitureHandler";
import { roomHandlers } from "./roomHandler";
import { aiHandlers } from "./aiHandler";

export const handlers = [
  ...userHandlers,
  ...designHandlers,
  ...furnitureHandlers,
  ...roomHandlers,
  ...aiHandlers,
];
