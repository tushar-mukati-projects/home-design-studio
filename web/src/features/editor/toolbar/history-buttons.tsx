"use client";

import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import { REDO_SHORTCUT, UNDO_SHORTCUT } from "../keyboard-shortcuts";

export const HistoryButtons = () => {
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.past.length > 0);
  const canRedo = useEditorStore((s) => s.future.length > 0);

  return (
    <>
      <Tooltip content={`Undo (${UNDO_SHORTCUT})`} side="bottom">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={!canUndo}>
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
      <Tooltip content={`Redo (${REDO_SHORTCUT})`} side="bottom">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={!canRedo}>
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>
    </>
  );
};
