import type { EditorTool } from "@/types";

type EditorShortcut =
  | { action: "clearSelection" }
  | { action: "undo" }
  | { action: "redo" }
  | { action: "deleteSelected" }
  | { action: "toggleGrid" }
  | { action: "toggleSnap" }
  | { action: "nudge"; dx: number; dy: number; large: boolean }
  | { action: "setTool"; tool: EditorTool };

export const TOOL_SHORTCUTS: Record<string, EditorTool> = {
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

export const shortcutForTool = (tool: EditorTool): string | undefined => {
  const entry = Object.entries(TOOL_SHORTCUTS).find(([, value]) => value === tool);
  return entry?.[0].toUpperCase();
};

const TYPING_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

interface ShortcutTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

export const isTypingTarget = (target: ShortcutTarget | null | undefined): boolean => {
  if (!target) return false;
  return TYPING_TAGS.has(target.tagName ?? "") || target.isContentEditable === true;
};

export interface ShortcutEvent {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  target?: ShortcutTarget | null;
}

const PREVENT_DEFAULT: ReadonlySet<EditorShortcut["action"]> = new Set([
  "undo",
  "redo",
  "deleteSelected",
  "nudge",
]);

export const shouldPreventDefault = (shortcut: EditorShortcut): boolean =>
  PREVENT_DEFAULT.has(shortcut.action);

export const resolveShortcut = (
  event: ShortcutEvent,
  options: { canEdit: boolean },
): EditorShortcut | null => {
  if (isTypingTarget(event.target)) return null;

  if (event.key === "Escape") return { action: "clearSelection" };
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
