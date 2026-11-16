"use client";

import { useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { X, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores/editor-store";
import { ImportFilePicker } from "./import-file-picker";
import { useImageFile } from "./use-image-file";
import { useImportDesign } from "./use-import-design";
import { UNDO_SHORTCUT } from "../keyboard-shortcuts";
import { useEditorModal } from "../use-editor-modal";

type ImportDesignModalProps = {
  open: boolean;
  onClose: () => void;
};

type PanelTone = "primary" | "destructive";

type PhasePanelProps = {
  icon: ReactNode;
  tone: PanelTone;
  title: string;
  detail: string;
};

const TONE_CLASSES: Record<PanelTone, string> = {
  primary: "bg-primary/10 text-primary",
  destructive: "bg-destructive/10 text-destructive",
};

const NO_FILE_MESSAGE = "Choose an image first";

export const ImportDesignModal = ({ open, onClose }: ImportDesignModalProps) => {
  const image = useImageFile();
  const clearImage = image.clear;
  const { phase, statusMessage, errorMessage, summary, analyze, confirm, reset } =
    useImportDesign();
  const hasContent = useEditorStore(
    (s) => s.walls.length > 0 || s.rooms.length > 0 || s.furniture.length > 0,
  );

  const close = useCallback(() => {
    reset();
    clearImage();
    onClose();
  }, [reset, clearImage, onClose]);

  useEditorModal(open);

  useEffect(() => {
    if (!open || phase === "analyzing") return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, phase, close]);

  const start = () => {
    if (!image.file) return toast.info(NO_FILE_MESSAGE);
    if (hasContent && phase === "upload") return confirm();
    analyze(image.file);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={close}
      >
        <motion.div
          className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl sm:mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Import from Image</h2>
                <p className="text-xs text-muted-foreground">
                  Design AI turns your photo into a floor plan
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {phase === "upload" && <ImportFilePicker image={image} />}
            {phase === "confirm" && (
              <PhasePanel
                icon={<AlertCircle className="size-8" />}
                tone="primary"
                title="Replace the current plan?"
                detail={`This can be undone with ${UNDO_SHORTCUT}.`}
              />
            )}
            {phase === "analyzing" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative">
                  <div className="size-16 animate-spin rounded-full border-4 border-secondary border-t-primary" />
                  <Sparkles className="absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Design AI is reading your image
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{statusMessage}</p>
                </div>
              </div>
            )}
            {phase === "success" && (
              <PhasePanel
                icon={<CheckCircle2 className="size-8" />}
                tone="primary"
                title="Design imported successfully!"
                detail={summary}
              />
            )}
            {phase === "error" && (
              <PhasePanel
                icon={<AlertCircle className="size-8" />}
                tone="destructive"
                title="We couldn't import this image"
                detail={errorMessage}
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
            {phase === "upload" && (
              <>
                <Button variant="ghost" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button size="sm" onClick={start} className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  Analyze & Import
                </Button>
              </>
            )}
            {phase === "confirm" && (
              <>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Cancel
                </Button>
                <Button size="sm" onClick={start}>
                  Replace
                </Button>
              </>
            )}
            {phase === "analyzing" && (
              <Button variant="ghost" size="sm" onClick={close}>
                Cancel
              </Button>
            )}
            {phase === "success" && (
              <Button size="sm" onClick={close}>
                Done
              </Button>
            )}
            {phase === "error" && (
              <>
                <Button variant="ghost" size="sm" onClick={close}>
                  Cancel
                </Button>
                <Button size="sm" onClick={reset}>
                  Try Again
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const PhasePanel = ({ icon, tone, title, detail }: PhasePanelProps) => (
  <div className="flex flex-col items-center gap-4 py-6">
    <div
      className={cn("flex size-14 items-center justify-center rounded-full", TONE_CLASSES[tone])}
    >
      {icon}
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  </div>
);
