"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorStore } from "@/stores/editor-store";
import { auth } from "@/lib/firebase";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Canvas } from "@/types";

interface ImportDesignModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportPhase = "upload" | "confirm" | "analyzing" | "success" | "error";

const importFailedMessage = "We couldn't read this image. Try another photo or plan.";

export const ImportDesignModal = ({ open, onClose }: ImportDesignModalProps) => {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const setCanvas = useEditorStore((s) => s.setCanvas);
  const hasContent = useEditorStore(
    (s) => s.walls.length > 0 || s.rooms.length > 0 || s.furniture.length > 0,
  );

  const handleClose = useCallback(() => {
    if (phase === "analyzing") {
      abortRef.current?.abort();
    }
    setPhase("upload");
    setSelectedFile(null);
    setPreviewUrl(null);
    setStatusMessage("");
    setErrorMessage("");
    setResultSummary("");
    onClose();
  }, [phase, onClose]);

  useEffect(() => {
    if (!open || phase === "analyzing") return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, phase, handleClose]);

  const handleFileSelect = useCallback((file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please upload a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Image is too large. Maximum size is 20MB.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMessage("");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile) return;

    setPhase("analyzing");
    setStatusMessage("Preparing image...");
    setErrorMessage("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const user = auth.currentUser;
      if (!user) {
        setPhase("error");
        setErrorMessage("You must be signed in to use this feature.");
        return;
      }

      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("image", selectedFile);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${apiUrl}/ai/image-to-design`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || importFailedMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error(importFailedMessage);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const payload = trimmed.slice(6);
          if (payload === "[DONE]") continue;

          try {
            const event = JSON.parse(payload);

            if (event.type === "status") {
              setStatusMessage(event.message);
            } else if (event.type === "error") {
              setPhase("error");
              setErrorMessage(event.message);
              return;
            } else if (event.type === "result") {
              const canvas = event.canvas as Canvas;
              setCanvas(canvas);
              setResultSummary(
                `${canvas.walls.length} walls, ${canvas.rooms.length} rooms, ${canvas.openings.length} openings, ${canvas.furniture.length} furniture items`,
              );
              setPhase("success");
            }
          } catch {}
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPhase("error");
      setErrorMessage(
        err instanceof TypeError
          ? "We can't connect right now. Check your connection and try again."
          : getApiErrorMessage(err, importFailedMessage),
      );
    }
  }, [selectedFile, setCanvas]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className="relative mx-4 w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl sm:mx-auto"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Import from Image
                </h2>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Design AI turns your photo into a floor plan
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-6 py-5">
            {phase === "upload" && (
              <div className="space-y-4">
                {!selectedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-[var(--border)] bg-[var(--background)] px-6 py-10 transition-colors hover:border-[var(--primary)] hover:bg-[var(--secondary)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--secondary)]">
                      <Upload className="h-6 w-6 text-[var(--muted-foreground)]" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-[var(--foreground)]">
                        Drop an image here or click to browse
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Room photos, floor plan sketches, or blueprints
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        JPEG, PNG, WebP, GIF • Max 20MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
                      <img
                        src={previewUrl!}
                        alt="Selected image"
                        className="mx-auto max-h-64 object-contain p-2"
                      />
                      <button
                        onClick={clearFile}
                        className="absolute top-2 right-2 rounded-lg bg-[var(--card)]/90 p-1.5 text-[var(--muted-foreground)] shadow-md backdrop-blur-sm transition-colors hover:bg-[var(--destructive)] hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-[var(--background)] px-3 py-2">
                      <ImageIcon className="h-4 w-4 text-[var(--muted-foreground)]" />
                      <span className="flex-1 truncate text-sm text-[var(--foreground)]">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}

            {phase === "confirm" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-8 w-8 text-amber-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Replace the current plan?
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    This can be undone with Ctrl+Z.
                  </p>
                </div>
              </div>
            )}

            {phase === "analyzing" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--secondary)] border-t-[var(--primary)]" />
                  <Sparkles className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[var(--primary)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Design AI is reading your image
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{statusMessage}</p>
                </div>
              </div>
            )}

            {phase === "success" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Design imported successfully!
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{resultSummary}</p>
                </div>
              </div>
            )}

            {phase === "error" && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    We couldn&apos;t import this image
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">{errorMessage}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
            {phase === "upload" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile}
                  onClick={hasContent ? () => setPhase("confirm") : handleAnalyze}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze & Import
                </Button>
              </>
            )}
            {phase === "confirm" && (
              <>
                <Button variant="ghost" size="sm" onClick={() => setPhase("upload")}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAnalyze}>
                  Replace
                </Button>
              </>
            )}
            {phase === "analyzing" && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                Cancel
              </Button>
            )}
            {phase === "success" && (
              <Button size="sm" onClick={handleClose}>
                Done
              </Button>
            )}
            {phase === "error" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setPhase("upload");
                    setErrorMessage("");
                  }}
                >
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
