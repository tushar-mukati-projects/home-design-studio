import { userHandlers } from "./userHandler";
import { designHandlers } from "./designHandler";
import { furnitureHandlers } from "./furnitureHandler";
import { aiHandlers } from "./aiHandler";

export const handlers = [...userHandlers, ...designHandlers, ...furnitureHandlers, ...aiHandlers];
