"use client";

import { useEffect } from "react";
import { GRID_MM, NUDGE_MM } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";
import { resolveShortcut, shouldPreventDefault, type EditorShortcut } from "./keyboard-shortcuts";

type EditorState = ReturnType<typeof useEditorStore.getState>;

export const useEditorShortcuts = (canEdit: boolean) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useEditorStore.getState();
      const shortcut = resolveShortcut(
        {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          target: e.target instanceof HTMLElement ? e.target : null,
        },
        { canEdit, muted: state.openModals > 0 },
      );
      if (!shortcut) return;
      const needsSelection = shortcut.action === "deleteSelected" || shortcut.action === "nudge";
      if (needsSelection && !state.selectedElementId) return;
      if (shouldPreventDefault(shortcut)) e.preventDefault();
      runShortcut(shortcut, state);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canEdit]);
};

const runShortcut = (shortcut: EditorShortcut, state: EditorState) => {
  switch (shortcut.action) {
    case "escape":
      return state.isDrawing ? state.stopDrawing() : state.clearSelection();
    case "undo":
      return state.undo();
    case "redo":
      return state.redo();
    case "deleteSelected":
      return state.selectedElementId && state.removeElement(state.selectedElementId);
    case "toggleGrid":
      return state.toggleGrid();
    case "toggleSnap":
      return state.toggleSnap();
    case "nudge": {
      const step = shortcut.large ? GRID_MM : NUDGE_MM;
      return state.nudgeSelected(shortcut.dx * step, shortcut.dy * step);
    }
    case "setTool":
      return state.setTool(shortcut.tool);
  }
};
