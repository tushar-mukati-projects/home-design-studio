import type { EditorTool } from "@/types";

export type EditorShortcut =
  | { action: "escape" }
  | { action: "undo" }
  | { action: "redo" }
  | { action: "deleteSelected" }
  | { action: "toggleGrid" }
  | { action: "toggleSnap" }
  | { action: "nudge"; dx: number; dy: number; large: boolean }
  | { action: "setTool"; tool: EditorTool };

export const UNDO_SHORTCUT = "Ctrl+Z";
export const REDO_SHORTCUT = "Ctrl+Shift+Z";

type ShortcutTarget = {
  tagName?: string;
  type?: string;
  isContentEditable?: boolean;
};

type ShortcutEvent = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: ShortcutTarget | null;
};

type ShortcutOptions = {
  canEdit: boolean;
  muted: boolean;
};

const TOOL_SHORTCUTS: Record<string, EditorTool> = {
  v: "select",
  w: "wall",
  d: "door",
  n: "window",
  e: "eraser",
  h: "pan",
};

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

const NON_TEXT_INPUTS = new Set([
  "range",
  "checkbox",
  "radio",
  "button",
  "submit",
  "color",
  "file",
]);

const ACTIVATION_TAGS = new Set(["BUTTON", "A", "SUMMARY"]);

const PREVENT_DEFAULT: ReadonlySet<EditorShortcut["action"]> = new Set([
  "undo",
  "redo",
  "deleteSelected",
  "nudge",
]);

export const resolveShortcut = (
  event: ShortcutEvent,
  options: ShortcutOptions,
): EditorShortcut | null => {
  if (options.muted || isTypingTarget(event.target)) return null;

  if (event.key === "Escape") return { action: "escape" };
  if (!options.canEdit) return null;

  const key = event.key.toLowerCase();
  const hasCmd = event.ctrlKey === true || event.metaKey === true;

  if ((key === "z" && hasCmd && event.shiftKey === true) || (key === "y" && event.ctrlKey === true))
    return { action: "redo" };
  if (key === "z" && hasCmd) return { action: "undo" };

  if (event.key === "Delete" || event.key === "Backspace") return { action: "deleteSelected" };

  if (hasCmd || event.altKey === true) return null;

  const arrow = ARROWS[event.key];
  if (arrow) return { action: "nudge", dx: arrow[0], dy: arrow[1], large: event.shiftKey === true };

  if (key === "g") return { action: "toggleGrid" };
  if (key === "s") return { action: "toggleSnap" };

  const tool = TOOL_SHORTCUTS[key];
  return tool ? { action: "setTool", tool } : null;
};

export const shouldPreventDefault = (shortcut: EditorShortcut): boolean =>
  PREVENT_DEFAULT.has(shortcut.action);

export const shortcutForTool = (tool: EditorTool): string => {
  const entry = Object.entries(TOOL_SHORTCUTS).find(([, value]) => value === tool);
  return entry ? entry[0].toUpperCase() : "";
};

export const isTypingTarget = (target: ShortcutTarget | null | undefined): boolean => {
  if (!target) return false;
  if (target.isContentEditable === true) return true;
  const tag = target.tagName ?? "";
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  return tag === "INPUT" && !NON_TEXT_INPUTS.has((target.type ?? "text").toLowerCase());
};

export const spaceStartsPan = (target: ShortcutTarget | null | undefined): boolean =>
  !isTypingTarget(target) && !ACTIVATION_TAGS.has(target?.tagName ?? "");
