import { describe, test, expect } from "bun:test";
import {
  isTypingTarget,
  resolveShortcut,
  shortcutForTool,
  shouldPreventDefault,
  spaceStartsPan,
} from "@/features/editor/keyboard-shortcuts";
import type { EditorTool } from "@/types";

type ShortcutEvent = Parameters<typeof resolveShortcut>[0];

const TOOLS: EditorTool[] = ["select", "wall", "door", "window", "eraser", "pan"];

const resolve = (event: ShortcutEvent, canEdit = true, muted = false) =>
  resolveShortcut(event, { canEdit, muted });

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

describe("resolveShortcut - muted while a modal is open", () => {
  test.each([
    { key: "Backspace" },
    { key: "w" },
    { key: "z", ctrlKey: true },
    { key: "Escape" },
    { key: "ArrowLeft" },
  ])("%j is inert while muted", (event) => {
    expect(resolve(event, true, true)).toBeNull();
  });
});

describe("isTypingTarget", () => {
  test("text-like inputs, textareas, selects and editable nodes swallow shortcuts", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "INPUT", type: "number" })).toBe(true);
    expect(isTypingTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTypingTarget({ tagName: "SELECT" })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  test("a focused slider or checkbox does not block undo", () => {
    expect(isTypingTarget({ tagName: "INPUT", type: "range" })).toBe(false);
    expect(isTypingTarget({ tagName: "INPUT", type: "checkbox" })).toBe(false);
    expect(
      resolve({ key: "z", ctrlKey: true, target: { tagName: "INPUT", type: "range" } }),
    ).toEqual({
      action: "undo",
    });
  });
});

describe("spaceStartsPan", () => {
  test.each([
    [null, true],
    [{ tagName: "BODY" }, true],
    [{ tagName: "DIV" }, true],
    [{ tagName: "BUTTON" }, false],
    [{ tagName: "A" }, false],
    [{ tagName: "INPUT" }, false],
    [{ tagName: "TEXTAREA" }, false],
  ])("Space on %j starts a pan: %p", (target, expected) => {
    expect(spaceStartsPan(target)).toBe(expected);
  });
});

describe("resolveShortcut - nudge", () => {
  test("arrow keys nudge the selection", () => {
    expect(resolve({ key: "ArrowLeft" })).toEqual({ action: "nudge", dx: -1, dy: 0, large: false });
    expect(resolve({ key: "ArrowDown", shiftKey: true })).toEqual({
      action: "nudge",
      dx: 0,
      dy: 1,
      large: true,
    });
  });

  test("arrows with Ctrl or Alt are left to the browser", () => {
    expect(resolve({ key: "ArrowUp", ctrlKey: true })).toBeNull();
    expect(resolve({ key: "ArrowUp", altKey: true })).toBeNull();
  });

  test("arrows do nothing for viewers and while typing", () => {
    expect(resolve({ key: "ArrowUp" }, false)).toBeNull();
    expect(resolve({ key: "ArrowUp", target: { tagName: "INPUT" } })).toBeNull();
  });

  test("nudges prevent the page from scrolling", () => {
    expect(shouldPreventDefault({ action: "nudge", dx: 1, dy: 0, large: false })).toBe(true);
  });
});

describe("resolveShortcut - tools", () => {
  test.each(TOOLS)("the tooltip key for %s selects it", (tool) => {
    const key = shortcutForTool(tool);
    expect(key).toMatch(/^[A-Z]$/);
    expect(resolve({ key: key.toLowerCase() })).toEqual({ action: "setTool", tool });
  });

  test("every tool has a distinct shortcut key", () => {
    const keys = TOOLS.map(shortcutForTool);
    expect(new Set(keys).size).toBe(TOOLS.length);
  });

  test("uppercase keys work too", () => {
    expect(resolve({ key: "W" })).toEqual({ action: "setTool", tool: "wall" });
  });

  test("shortcut keys do not collide with the grid/snap keys", () => {
    expect(TOOLS.map(shortcutForTool)).not.toContain("G");
    expect(TOOLS.map(shortcutForTool)).not.toContain("S");
  });

  test("unmapped keys resolve to nothing", () => {
    for (const key of ["q", "1", "F5", "Tab", " "]) {
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

  test("Escape is the one escape action", () => {
    expect(resolve({ key: "Escape" })).toEqual({ action: "escape" });
  });
});

describe("resolveShortcut - read-only viewers", () => {
  test("Escape still works without edit rights", () => {
    expect(resolve({ key: "Escape" }, false)).toEqual({ action: "escape" });
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
    expect(shouldPreventDefault({ action: "escape" })).toBe(false);
    expect(shouldPreventDefault({ action: "toggleGrid" })).toBe(false);
    expect(shouldPreventDefault({ action: "setTool", tool: "wall" })).toBe(false);
  });
});

describe("shortcutForTool", () => {
  test("returns the uppercase key shown in tooltips", () => {
    expect(shortcutForTool("select")).toBe("V");
    expect(shortcutForTool("window")).toBe("N");
  });
});
