"use client";

import { useEffect } from "react";
import { useEditorStore } from "@/stores/editor-store";

export const useEditorModal = (open: boolean) => {
  useEffect(() => {
    if (!open) return;
    const { setModalOpen } = useEditorStore.getState();
    setModalOpen(true);
    return () => setModalOpen(false);
  }, [open]);
};
