import { designHandlers } from "./designHandler";
import { furnitureHandlers } from "./furnitureHandler";
import { aiHandlers } from "./aiHandler";

export const handlers = [...designHandlers, ...furnitureHandlers, ...aiHandlers];
