import { meHandlers } from "./meHandler";
import { designHandlers } from "./designHandler";
import { furnitureHandlers } from "./furnitureHandler";
import { aiHandlers } from "./aiHandler";

export const handlers = [...meHandlers, ...designHandlers, ...furnitureHandlers, ...aiHandlers];
