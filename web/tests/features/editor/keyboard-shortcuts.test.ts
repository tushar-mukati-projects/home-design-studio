import { describe, test, expect } from "bun:test";
import {
  TOOL_SHORTCUTS,
  isTypingTarget,
  resolveShortcut,
  shortcutForTool,
  shouldPreventDefault,
} from "@/features/editor/keyboard-shortcuts";
import type { ShortcutEvent } from "@/features/editor/keyboard-shortcuts";
import type { EditorTool } from "@/types";

const resolve = (event: ShortcutEvent, canEdit = true) => resolveShortcut(event, { canEdit });

describe("resolveShortcut - undo/redo", () => {
  test("Ctrl+Z undoes", () => {
    expect(resolve({ key: "z", ctrlKey: true })).toEqual({ action: "undo" });
  });

  test("Cmd+Z undoes", () => {
    expect(resolve({ key: "z", metaKey: true })).toEqual({ action: "undo" });
  });

  test("Ctrl+Shift+Z redoes even though Shift uppercases the key", () => {
    expect(resolve({ key: "Z", ctrlKey: true, shiftKey: true })).toEqual({ action: "redo" });
  });

  test("Cmd+Shift+Z redoes", () => {
    expect(resolve({ key: "Z", metaKey: true, shiftKey: true })).toEqual({ action: "redo" });
  });

  test("Ctrl+Y redoes (Windows convention)", () => {
    expect(resolve({ key: "y", ctrlKey: true })).toEqual({ action: "redo" });
  });

  test("bare z does nothing", () => {
    expect(resolve({ key: "z" })).toBeNull();
  });
});

describe("resolveShortcut - modifiers must not hijack browser combos", () => {
  const hijackable = ["v", "w", "d", "n", "e", "h", "g", "s"];

  test.each(hijackable)("Ctrl+%s is ignored", (key) => {
    expect(resolve({ key, ctrlKey: true })).toBeNull();
  });

  test.each(hijackable)("Cmd+%s is ignored", (key) => {
    expect(resolve({ key, metaKey: true })).toBeNull();
  });

  test.each(hijackable)("Alt+%s is ignored", (key) => {
    expect(resolve({ key, altKey: true })).toBeNull();
  });
});

describe("resolveShortcut - tools", () => {
  const toolKeys: [string, EditorTool][] = [
    ["v", "select"],
    ["w", "wall"],
    ["d", "door"],
    ["n", "window"],
    ["e", "eraser"],
    ["h", "pan"],
  ];

  test.each(toolKeys)("%s selects the %s tool", (key, tool) => {
    expect(resolve({ key })).toEqual({ action: "setTool", tool });
  });

  test("uppercase keys work too", () => {
    expect(resolve({ key: "W" })).toEqual({ action: "setTool", tool: "wall" });
  });

  test("every tool has a distinct shortcut key", () => {
    const keys = Object.keys(TOOL_SHORTCUTS);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(Object.values(TOOL_SHORTCUTS)).size).toBe(keys.length);
  });

  test("shortcut keys do not collide with the grid/snap keys", () => {
    expect(Object.keys(TOOL_SHORTCUTS)).not.toContain("g");
    expect(Object.keys(TOOL_SHORTCUTS)).not.toContain("s");
  });

  test("unmapped keys resolve to nothing", () => {
    for (const key of ["q", "1", "F5", "ArrowLeft", " "]) {
      expect(resolve({ key })).toBeNull();
    }
  });
});

describe("resolveShortcut - toggles and selection", () => {
  test("g toggles the grid", () => {
    expect(resolve({ key: "g" })).toEqual({ action: "toggleGrid" });
  });

  test("s toggles snapping", () => {
    expect(resolve({ key: "s" })).toEqual({ action: "toggleSnap" });
  });

  test("Ctrl+S is left to the browser", () => {
    expect(resolve({ key: "s", ctrlKey: true })).toBeNull();
  });

  test("Delete and Backspace delete the selection", () => {
    expect(resolve({ key: "Delete" })).toEqual({ action: "deleteSelected" });
    expect(resolve({ key: "Backspace" })).toEqual({ action: "deleteSelected" });
  });

  test("Escape clears the selection", () => {
    expect(resolve({ key: "Escape" })).toEqual({ action: "clearSelection" });
  });
});

describe("resolveShortcut - read-only viewers", () => {
  test("Escape still works without edit rights", () => {
    expect(resolve({ key: "Escape" }, false)).toEqual({ action: "clearSelection" });
  });

  test.each(["z", "y", "v", "w", "d", "n", "e", "h", "g", "s", "Delete", "Backspace"])(
    "%s is inert without edit rights",
    (key) => {
      expect(resolve({ key, ctrlKey: key === "z" || key === "y" }, false)).toBeNull();
    },
  );
});

describe("resolveShortcut - typing targets", () => {
  test.each(["INPUT", "TEXTAREA", "SELECT"])("keys typed in %s are ignored", (tagName) => {
    expect(resolve({ key: "w", target: { tagName } })).toBeNull();
    expect(resolve({ key: "Escape", target: { tagName } })).toBeNull();
    expect(resolve({ key: "Backspace", target: { tagName } })).toBeNull();
  });

  test("contentEditable targets are ignored", () => {
    expect(resolve({ key: "w", target: { tagName: "DIV", isContentEditable: true } })).toBeNull();
  });

  test("other elements are not typing targets", () => {
    expect(resolve({ key: "w", target: { tagName: "DIV" } })).toEqual({
      action: "setTool",
      tool: "wall",
    });
  });

  test("isTypingTarget handles missing targets", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(undefined)).toBe(false);
    expect(isTypingTarget({})).toBe(false);
  });
});

describe("shouldPreventDefault", () => {
  test("suppresses browser behaviour for history and delete", () => {
    expect(shouldPreventDefault({ action: "undo" })).toBe(true);
    expect(shouldPreventDefault({ action: "redo" })).toBe(true);
    expect(shouldPreventDefault({ action: "deleteSelected" })).toBe(true);
  });

  test("leaves harmless actions alone", () => {
    expect(shouldPreventDefault({ action: "clearSelection" })).toBe(false);
    expect(shouldPreventDefault({ action: "toggleGrid" })).toBe(false);
    expect(shouldPreventDefault({ action: "setTool", tool: "wall" })).toBe(false);
  });
});

describe("shortcutForTool", () => {
  test("returns the uppercase key shown in tooltips", () => {
    expect(shortcutForTool("select")).toBe("V");
    expect(shortcutForTool("window")).toBe("N");
  });

  test("round-trips with the shortcut table so tooltips cannot drift", () => {
    for (const [key, tool] of Object.entries(TOOL_SHORTCUTS)) {
      expect(shortcutForTool(tool)).toBe(key.toUpperCase());
    }
  });
});
