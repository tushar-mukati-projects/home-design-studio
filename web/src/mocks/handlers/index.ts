import { accessHandlers } from "./accessHandler";
import { billingHandlers } from "./billingHandler";
import { designHandlers } from "./designHandler";
import { furnitureHandlers } from "./furnitureHandler";
import { meHandlers } from "./meHandler";
import { templateHandlers } from "./templateHandler";
import { versionHandlers } from "./versionHandler";

export const handlers = [
  ...meHandlers,
  ...designHandlers,
  ...accessHandlers,
  ...versionHandlers,
  ...furnitureHandlers,
  ...templateHandlers,
  ...billingHandlers,
];
