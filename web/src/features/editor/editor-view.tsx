"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Loader2,
  MousePointer2,
  PenLine,
  DoorOpen,
  Columns2,
  Eraser,
  Hand,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type Konva from "konva";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useEditorStore } from "@/stores/editor-store";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { EditorCanvas } from "./canvas/editor-canvas";
import { PropertiesPanel } from "./properties-panel/properties-panel";
import { FurnitureCatalog } from "./furniture-catalog/furniture-catalog";
import { PreviewModal } from "./three-d-preview/preview-modal";
import { ShareModal } from "./sharing/share-modal";
import type { EditorTool } from "@/types";
import { UpgradeModal } from "@/features/billing/upgrade-modal";
import { VersionHistoryPanel } from "./version-history/version-history-panel";
import { ImportDesignModal } from "./import/import-design-modal";
import { DesignChat } from "./ai-chat/design-chat";
import { useCollaboration, ConnectionStatus } from "./collaboration";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { resolveShortcut, shouldPreventDefault, shortcutForTool } from "./keyboard-shortcuts";
import { PX_PER_MM } from "@/lib/constants";
import { boundsOf } from "@/lib/canvas";
interface EditorViewProps {
  designId: string;
  preloadedDesign?: import("@/types").Design | null;
  permissionOverride?: import("@/types").DesignPermission;
}

interface SidebarTool {
  tool: EditorTool;
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const BASE_TOOLS: Omit<SidebarTool, "shortcut">[] = [
  { tool: "select", icon: <MousePointer2 className="h-5 w-5" />, label: "Select" },
  { tool: "wall", icon: <PenLine className="h-5 w-5" />, label: "Draw Wall" },
  { tool: "door", icon: <DoorOpen className="h-5 w-5" />, label: "Door" },
  { tool: "window", icon: <Columns2 className="h-5 w-5" />, label: "Window" },
  { tool: "eraser", icon: <Eraser className="h-5 w-5" />, label: "Eraser" },
  { tool: "pan", icon: <Hand className="h-5 w-5" />, label: "Pan" },
];

const SIDEBAR_TOOLS: SidebarTool[] = BASE_TOOLS.map((t) => ({
  ...t,
  shortcut: shortcutForTool(t.tool),
}));

// Only this label re-renders as the zoom changes; the rest of the editor chrome does not.
const ZoomLabel = ({ onClick }: { onClick: () => void }) => {
  const zoom = useEditorStore((s) => s.zoom);
  return (
    <button
      onClick={onClick}
      className="min-w-[40px] px-1 py-1 font-mono text-[10px] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)] sm:min-w-[52px] sm:px-2 sm:text-xs"
    >
      {Math.round(zoom * 100)}%
    </button>
  );
};

const fitToScreen = (
  container: HTMLDivElement,
  setZoomFn: (z: number) => void,
  setPanFn: (x: number, y: number) => void,
) => {
  const rect = container.getBoundingClientRect();
  if (rect.width <= 1 || rect.height <= 1) return;

  const bounds = boundsOf(useEditorStore.getState());
  if (!bounds) {
    setPanFn(rect.width / 2, rect.height / 2);
    return;
  }

  // Content is in millimetres; a 1 m margin keeps walls off the edge.
  const margin = 1000;
  const contentW = (bounds.maxX - bounds.minX + margin * 2) * PX_PER_MM;
  const contentH = (bounds.maxY - bounds.minY + margin * 2) * PX_PER_MM;
  const padding = 80;
  const fitZoom = Math.max(
    0.1,
    Math.min(1.5, (rect.width - padding * 2) / contentW, (rect.height - padding * 2) / contentH),
  );
  const cx = ((bounds.minX + bounds.maxX) / 2) * PX_PER_MM;
  const cy = ((bounds.minY + bounds.maxY) / 2) * PX_PER_MM;

  setZoomFn(fitZoom);
  setPanFn(rect.width / 2 - cx * fitZoom, rect.height / 2 - cy * fitZoom);
};

export const EditorView = ({ designId, preloadedDesign, permissionOverride }: EditorViewProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const designLoadedRef = useRef<string | null>(null);
  const [rightPanel, setRightPanel] = useState<"properties" | "furniture">("properties");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showPreview3D, setShowPreview3D] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const collaborationEnabled = !permissionOverride;
  const {
    isConnected,
    isSynced,
    hasSyncedOnce,
    broadcastCursor,
    designMeta,
    updateDesignName,
    error,
  } = useCollaboration(designId, collaborationEnabled);
  const collaborators = useCollaborationStore((s) => s.collaborators);

  const canEdit = permissionOverride
    ? permissionOverride === "owner" || permissionOverride === "readwrite"
    : designMeta.canEdit;
  const isOwner = permissionOverride ? permissionOverride === "owner" : designMeta.isOwner;

  const activeTool = useEditorStore((s) => s.activeTool);
  const setTool = useEditorStore((s) => s.setTool);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const toggleSnap = useEditorStore((s) => s.toggleSnap);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const removeElement = useEditorStore((s) => s.removeElement);

  useEffect(() => {
    useEditorStore.getState().setCanEdit(canEdit);
  }, [canEdit]);

  useEffect(() => {
    const unsub = useEditorStore.subscribe((state, prevState) => {
      if (state.selectedElementId && state.selectedElementId !== prevState.selectedElementId) {
        setRightPanel("properties");
      }
    });
    return unsub;
  }, []);

  const designName = collaborationEnabled
    ? designMeta.name
    : (preloadedDesign?.name ?? designMeta.name);

  useEffect(() => {
    if (!preloadedDesign) return;
    if (designLoadedRef.current === preloadedDesign.id) return;
    designLoadedRef.current = preloadedDesign.id;

    useEditorStore.getState().loadDesign(preloadedDesign);

    requestAnimationFrame(() => {
      const container = canvasContainerRef.current;
      if (container) fitToScreen(container, setZoom, setPan);
    });
  }, [preloadedDesign, setZoom, setPan]);

  const fittedRef = useRef(false);
  useEffect(() => {
    fittedRef.current = false;
    designLoadedRef.current = null;
  }, [designId]);

  useEffect(() => {
    if (!isSynced || fittedRef.current) return;
    fittedRef.current = true;
    requestAnimationFrame(() => {
      const container = canvasContainerRef.current;
      if (container) fitToScreen(container, setZoom, setPan);
    });
  }, [isSynced, setZoom, setPan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const shortcut = resolveShortcut(
        {
          key: e.key,
          ctrlKey: e.ctrlKey,
          metaKey: e.metaKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          target: e.target as HTMLElement | null,
        },
        { canEdit },
      );
      if (!shortcut) return;

      if (shortcut.action === "deleteSelected" && !selectedElementId) return;
      if (shouldPreventDefault(shortcut)) e.preventDefault();

      switch (shortcut.action) {
        case "clearSelection":
          clearSelection();
          return;
        case "undo":
          undo();
          return;
        case "redo":
          redo();
          return;
        case "deleteSelected":
          removeElement(selectedElementId!);
          return;
        case "toggleGrid":
          toggleGrid();
          return;
        case "toggleSnap":
          toggleSnap();
          return;
        case "setTool":
          setTool(shortcut.tool);
          return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canEdit,
    selectedElementId,
    undo,
    redo,
    clearSelection,
    toggleGrid,
    toggleSnap,
    setTool,
    removeElement,
  ]);

  const handleNameChange = useCallback(
    (name: string) => {
      updateDesignName(name);
    },
    [updateDesignName],
  );

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(useEditorStore.getState().zoom * 1.2, 5));
  }, [setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(useEditorStore.getState().zoom / 1.2, 0.1));
  }, [setZoom]);

  const handleZoomReset = useCallback(() => {
    const container = canvasContainerRef.current;
    if (!container) {
      setZoom(1);
      setPan(0, 0);
      return;
    }
    fitToScreen(container, setZoom, setPan);
  }, [setZoom, setPan]);

  if (error && !preloadedDesign) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            Unable to open this design. You may not have access, or it no longer exists.
          </p>
          <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
            Back to dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!hasSyncedOnce && !preloadedDesign) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--muted-foreground)]">Loading design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <EditorToolbar
        designName={designName}
        onNameChange={handleNameChange}
        onToggle3DPreview={() => setShowPreview3D(true)}
        onToggleShare={() => setShowShareModal(true)}
        onToggleHistory={() => setShowVersionHistory((v) => !v)}
        onToggleUpgrade={() => setShowUpgradeModal(true)}
        onToggleImport={() => setShowImportModal(true)}
        stageRef={stageRef}
        canEdit={canEdit}
        isOwner={isOwner}
      />

      <div className="flex flex-1 overflow-hidden">
        {canEdit && (
          <motion.div
            className="hidden w-14 shrink-0 flex-col items-center gap-1 border-r border-[var(--border)] bg-[var(--sidebar-background)] py-3 md:flex"
            initial={{ x: -56 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {SIDEBAR_TOOLS.map((t) => {
              const isActive = activeTool === t.tool;
              return (
                <Tooltip
                  key={t.tool}
                  content={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
                  side="right"
                >
                  <button
                    onClick={() => setTool(t.tool)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all ${
                      isActive
                        ? "bg-[var(--sidebar-accent)] text-white shadow-md"
                        : "text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)]/50 hover:text-white"
                    }`}
                  >
                    {t.icon}
                  </button>
                </Tooltip>
              );
            })}

            <div className="my-2 h-px w-6 bg-white/10" />

            <Tooltip content="Layers" side="right">
              <button
                onClick={() => {
                  setRightPanel("properties");
                  setShowRightPanel((v) => !v);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--sidebar-foreground)] transition-all hover:bg-[var(--sidebar-accent)]/50 hover:text-white"
              >
                <Layers className="h-5 w-5" />
              </button>
            </Tooltip>
          </motion.div>
        )}

        <div className="relative flex-1 bg-[var(--canvas-bg)]" ref={canvasContainerRef}>
          <EditorCanvas
            containerRef={canvasContainerRef}
            stageRef={stageRef}
            onCursorMove={canEdit ? broadcastCursor : undefined}
          />

          {collaborationEnabled && canEdit && (
            <div className="absolute top-2 right-2 z-10 sm:top-4 sm:right-4">
              <ConnectionStatus
                isConnected={isConnected}
                isSynced={isSynced}
                collaborators={collaborators}
              />
            </div>
          )}

          <AnimatePresence>
            {canEdit && showRightPanel && (
              <>
                <motion.div
                  className="absolute top-4 right-4 z-20 hidden w-[280px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl md:block"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ maxHeight: "calc(100% - 80px)" }}
                >
                  <div className="flex h-10 items-center justify-between border-b border-[var(--border)] px-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRightPanel("properties")}
                        className={`rounded px-2 py-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                          rightPanel === "properties"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        Properties
                      </button>
                      <button
                        onClick={() => setRightPanel("furniture")}
                        className={`rounded px-2 py-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                          rightPanel === "furniture"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        Furniture
                      </button>
                    </div>
                    <button
                      onClick={() => setShowRightPanel(false)}
                      className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  </div>
                  <div
                    className="overflow-x-hidden overflow-y-auto"
                    style={{ maxHeight: "calc(100vh - 200px)" }}
                  >
                    {rightPanel === "properties" ? <PropertiesPanel /> : <FurnitureCatalog />}
                  </div>
                </motion.div>

                <motion.div
                  className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-t-2xl border-t border-[var(--border)] bg-[var(--card)] shadow-2xl md:hidden"
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 100 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ maxHeight: "55vh" }}
                >
                  <div className="flex h-10 items-center justify-between border-b border-[var(--border)] px-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setRightPanel("properties")}
                        className={`rounded px-2 py-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                          rightPanel === "properties"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        Properties
                      </button>
                      <button
                        onClick={() => setRightPanel("furniture")}
                        className={`rounded px-2 py-1 text-[10px] font-semibold tracking-wider uppercase transition-colors ${
                          rightPanel === "furniture"
                            ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                            : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        }`}
                      >
                        Furniture
                      </button>
                    </div>
                    <button
                      onClick={() => setShowRightPanel(false)}
                      className="rounded p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      <span className="text-sm">✕</span>
                    </button>
                  </div>
                  <div
                    className="overflow-x-hidden overflow-y-auto"
                    style={{ maxHeight: "calc(55vh - 40px)" }}
                  >
                    {rightPanel === "properties" ? <PropertiesPanel /> : <FurnitureCatalog />}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--card)] p-0.5 shadow-lg sm:bottom-4 sm:gap-1 sm:p-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Tooltip content="Zoom Out" side="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomOut}
              >
                <ZoomOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Tooltip>
            <ZoomLabel onClick={handleZoomReset} />
            <Tooltip content="Zoom In" side="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomIn}
              >
                <ZoomIn className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Tooltip>
            <div className="mx-0.5 h-4 w-px bg-[var(--border)] sm:h-5" />
            <Tooltip content="Fit to Screen" side="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomReset}
              >
                <Maximize className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Tooltip>
          </motion.div>

          {canEdit && (
            <div className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--sidebar-background)] p-1 shadow-lg md:hidden">
              {SIDEBAR_TOOLS.map((t) => {
                const isActive = activeTool === t.tool;
                return (
                  <button
                    key={t.tool}
                    onClick={() => setTool(t.tool)}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-all ${
                      isActive
                        ? "bg-[var(--sidebar-accent)] text-white shadow-md"
                        : "text-[var(--sidebar-foreground)]"
                    }`}
                  >
                    {t.icon}
                  </button>
                );
              })}
              <div className="mx-0.5 h-5 w-px bg-white/10" />
              <button
                onClick={() => {
                  setRightPanel("properties");
                  setShowRightPanel((v) => !v);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[var(--sidebar-foreground)]"
              >
                <Layers className="h-5 w-5" />
              </button>
            </div>
          )}

          <AnimatePresence>
            {activeTool === "wall" && (
              <motion.div
                className="absolute top-2 left-2 hidden rounded-lg border border-[var(--border)] bg-[var(--card)]/90 px-3 py-2 text-xs text-[var(--muted-foreground)] shadow-md backdrop-blur-sm sm:top-4 sm:left-4 sm:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Click to start drawing. Click again to place wall endpoint. Double-click or Escape
                to stop.
              </motion.div>
            )}
            {activeTool === "door" && (
              <motion.div
                className="absolute top-2 left-2 hidden rounded-lg border border-[var(--border)] bg-[var(--card)]/90 px-3 py-2 text-xs text-[var(--muted-foreground)] shadow-md backdrop-blur-sm sm:top-4 sm:left-4 sm:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Click on a wall to place a door.
              </motion.div>
            )}
            {activeTool === "window" && (
              <motion.div
                className="absolute top-2 left-2 hidden rounded-lg border border-[var(--border)] bg-[var(--card)]/90 px-3 py-2 text-xs text-[var(--muted-foreground)] shadow-md backdrop-blur-sm sm:top-4 sm:left-4 sm:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                Click on a wall to place a window.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canEdit && showVersionHistory && (
              <motion.div
                className="absolute top-0 right-0 bottom-0 z-30 w-[300px]"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <VersionHistoryPanel
                  designId={designId}
                  onClose={() => setShowVersionHistory(false)}
                  onRestored={() => window.location.reload()}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <PreviewModal open={showPreview3D} onClose={() => setShowPreview3D(false)} />
      {isOwner && (
        <ShareModal
          open={showShareModal}
          onClose={() => setShowShareModal(false)}
          designId={designId}
          designName={designName}
        />
      )}
      <UpgradeModal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
      <ImportDesignModal open={showImportModal} onClose={() => setShowImportModal(false)} />
      <DesignChat designId={designId} onUpgradeRequired={() => setShowUpgradeModal(true)} />
    </div>
  );
};
