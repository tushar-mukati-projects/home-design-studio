"use client";

import { useState, useCallback, useRef } from "react";
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
import type { Wall, Door, Window, Room, PlacedFurniture } from "@/types";
import { LOCAL_FURNITURE_ITEMS } from "../furniture-catalog/furniture-data";

interface ImportDesignModalProps {
  open: boolean;
  onClose: () => void;
}

interface AIDesignResult {
  walls: { x1: number; y1: number; x2: number; y2: number; thickness: number }[];
  doors: { wallIndex: number; position: number; width: number; type: "single" | "double" | "sliding" }[];
  windows: { wallIndex: number; position: number; width: number }[];
  rooms: { name: string; type: string; points: { x: number; y: number }[] }[];
  furniture: { name: string; x: number; y: number; rotation: number; width: number; height: number }[];
  canvasWidth: number;
  canvasHeight: number;
}

type ImportPhase = "upload" | "analyzing" | "success" | "error";

const genId = () => crypto.randomUUID();

const computeRoomArea = (points: { x: number; y: number }[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
};

const ROOM_COLORS: Record<string, string> = {
  living_room: "#d4d4d8",
  bedroom: "#c8c8d0",
  kitchen: "#d8d8dc",
  bathroom: "#c0c8d0",
  office: "#ccc8c4",
  dining: "#d0d0d4",
  hallway: "#e0e0e4",
  garage: "#b8b8bc",
  generic: "#d4d4d8",
};

const matchFurnitureItem = (name: string) => {
  const lower = name.toLowerCase();
  return LOCAL_FURNITURE_ITEMS.find((item) => {
    const itemLower = item.name.toLowerCase();
    return lower.includes(itemLower) || itemLower.includes(lower);
  });
};

const convertToEditorData = (result: AIDesignResult) => {
  const walls: Wall[] = result.walls.map((w) => ({
    id: genId(),
    x1: w.x1,
    y1: w.y1,
    x2: w.x2,
    y2: w.y2,
    thickness: w.thickness || 12,
    color: "#52525b",
  }));

  const doors: Door[] = result.doors
    .filter((d) => d.wallIndex >= 0 && d.wallIndex < walls.length)
    .map((d) => ({
      id: genId(),
      wallId: walls[d.wallIndex].id,
      position: d.position,
      width: d.width || 80,
      type: d.type || "single",
    }));

  const windows: Window[] = result.windows
    .filter((w) => w.wallIndex >= 0 && w.wallIndex < walls.length)
    .map((w) => ({
      id: genId(),
      wallId: walls[w.wallIndex].id,
      position: w.position,
      width: w.width || 100,
    }));

  const rooms: Room[] = result.rooms
    .filter((r) => r.points && r.points.length >= 3)
    .map((r) => ({
      id: genId(),
      name: r.name,
      type: r.type,
      color: ROOM_COLORS[r.type] || ROOM_COLORS.generic,
      points: r.points,
      area: computeRoomArea(r.points),
    }));

  const furniture: PlacedFurniture[] = result.furniture.map((f) => {
    const matched = matchFurnitureItem(f.name);
    const furnitureItem = matched || {
      id: `custom-${genId()}`,
      name: f.name,
      category: "living-room",
      width: f.width,
      height: f.height,
      depth: 50,
      color: "#d4d4d8",
    };

    return {
      id: genId(),
      furnitureItemId: furnitureItem.id,
      furnitureItem,
      x: f.x,
      y: f.y,
      rotation: f.rotation || 0,
      scaleX: matched ? f.width / matched.width || 1 : 1,
      scaleY: matched ? f.height / matched.height || 1 : 1,
    };
  });

  return { walls, doors, windows, rooms, furniture };
};

export const ImportDesignModal = ({ open, onClose }: ImportDesignModalProps) => {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const pushHistory = useEditorStore((s) => s.pushHistory);
  const clearCanvas = useEditorStore((s) => s.clearCanvas);
  const addWall = useEditorStore((s) => s.addWall);
  const addDoor = useEditorStore((s) => s.addDoor);
  const addWindow = useEditorStore((s) => s.addWindow);
  const setRooms = useEditorStore((s) => s.setRooms);
  const addFurniture = useEditorStore((s) => s.addFurniture);

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
        const err = await response.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

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
              const design = event.design as AIDesignResult;
              const editorData = convertToEditorData(design);

              pushHistory();
              clearCanvas();

              for (const wall of editorData.walls) addWall(wall);
              for (const door of editorData.doors) addDoor(door);
              for (const win of editorData.windows) addWindow(win);
              setRooms(editorData.rooms);
              for (const f of editorData.furniture) addFurniture(f);

              setResultSummary(
                `${editorData.walls.length} walls, ${editorData.rooms.length} rooms, ${editorData.doors.length} doors, ${editorData.windows.length} windows, ${editorData.furniture.length} furniture items`,
              );
              setPhase("success");
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setPhase("error");
      setErrorMessage((err as Error).message || "Analysis failed. Please try again.");
    }
  }, [selectedFile, pushHistory, clearCanvas, addWall, addDoor, addWindow, setRooms, addFurniture]);

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
          {/* Header */}
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
                  AI converts your photo into a floor plan
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

          {/* Body */}
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
                      {/* eslint-disable-next-line @next/next/no-img-element */}
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

            {phase === "analyzing" && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="relative">
                  <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--secondary)] border-t-[var(--primary)]" />
                  <Sparkles className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-[var(--primary)]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    AI is analyzing your image
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {statusMessage}
                  </p>
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
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {resultSummary}
                  </p>
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
                    Analysis failed
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {errorMessage}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-6 py-4">
            {phase === "upload" && (
              <>
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedFile}
                  onClick={handleAnalyze}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Analyze & Import
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
