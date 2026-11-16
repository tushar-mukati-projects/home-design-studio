"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type Konva from "konva";
import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/features/billing/upgrade-modal";
import { useFetchDesign } from "@/hooks/designs/useFetchDesign";
import { useFetchFurniture } from "@/hooks/furniture/useFetchFurniture";
import { boundsOf, fitView } from "@/lib/canvas";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { useEditorStore } from "@/stores/editor-store";
import { DesignChat } from "./ai-chat/design-chat";
import { EditorCanvas } from "./canvas/editor-canvas";
import { ConnectionStatus } from "./collaboration/connection-status";
import { useCollaboration, type OpenFailure } from "./collaboration/use-collaboration";
import { ImportDesignModal } from "./import/import-design-modal";
import { ShareModal } from "./sharing/share-modal";
import { SidePanel, type SidePanelTab } from "./side-panel";
import { PreviewModal } from "./three-d-preview/preview-modal";
import { ToolRail } from "./tool-rail";
import { EditorToolbar } from "./toolbar/editor-toolbar";
import { useEditorModal } from "./use-editor-modal";
import { useEditorShortcuts } from "./use-editor-shortcuts";
import { VersionHistoryPanel } from "./version-history/version-history-panel";
import { ZoomControls } from "./zoom-controls";
import type { DesignPermission } from "@/shared/canvas";
import type { Design, EditorTool } from "@/types";

type EditorViewProps = {
  designId: string;
  preloadedDesign?: Design | null;
  permissionOverride?: DesignPermission;
};

type EditorModal = "preview" | "share" | "upgrade" | "import";

const TOOL_HINTS: Partial<Record<EditorTool, string>> = {
  wall: "Click to start drawing. Click again to place wall endpoint. Double-click or Escape to stop.",
  door: "Click on a wall to place a door.",
  window: "Click on a wall to place a window.",
};

const FAILURE_MESSAGES: Record<OpenFailure, string> = {
  denied: "Unable to open this design. You may not have access, or it no longer exists.",
  timeout: "We couldn't reach the server to open this design. Check your connection and retry.",
};

export const EditorView = ({ designId, preloadedDesign, permissionOverride }: EditorViewProps) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const loadedDesignRef = useRef<string | null>(null);
  const fittedRef = useRef(false);
  const [sideTab, setSideTab] = useState<SidePanelTab>("properties");
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [modal, setModal] = useState<EditorModal | null>(null);

  const collaborationEnabled = !permissionOverride;
  const { hasSyncedOnce, broadcastCursor, designMeta, updateDesignName, failure } =
    useCollaboration(designId, collaborationEnabled);
  const isConnected = useCollaborationStore((s) => s.isConnected);
  const isSynced = useCollaborationStore((s) => s.isSynced);
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const { data: design } = useFetchDesign(collaborationEnabled ? designId : "");
  const { data: catalog } = useFetchFurniture();
  const activeTool = useEditorStore((s) => s.activeTool);

  const canEdit = permissionOverride
    ? permissionOverride !== "readonly"
    : designMeta.canEdit && isSynced;
  const isOwner = permissionOverride
    ? permissionOverride === "owner"
    : design?.permission === "owner";
  const designName = collaborationEnabled
    ? designMeta.name
    : (preloadedDesign?.name ?? designMeta.name);

  useEditorShortcuts(canEdit);

  const fitCanvas = useCallback(() => {
    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 1 || rect.height <= 1) return;
    const state = useEditorStore.getState();
    state.setView(fitView(boundsOf(state), rect, state.zoom));
  }, []);

  useEffect(() => {
    useEditorStore.getState().setCanEdit(canEdit);
  }, [canEdit]);

  useEffect(() => {
    if (catalog) useEditorStore.getState().setCatalog(catalog);
  }, [catalog]);

  useEffect(
    () =>
      useEditorStore.subscribe((state, prev) => {
        if (state.selectedElementId && state.selectedElementId !== prev.selectedElementId) {
          setSideTab("properties");
        }
      }),
    [],
  );

  useEffect(() => {
    if (!preloadedDesign || loadedDesignRef.current === preloadedDesign.id) return;
    loadedDesignRef.current = preloadedDesign.id;
    useEditorStore.getState().loadDesign(preloadedDesign);
    requestAnimationFrame(fitCanvas);
  }, [preloadedDesign, fitCanvas]);

  useEffect(() => {
    if (!isSynced || fittedRef.current) return;
    fittedRef.current = true;
    requestAnimationFrame(fitCanvas);
  }, [isSynced, fitCanvas]);

  useEditorModal(modal === "upgrade");

  if (failure && !preloadedDesign) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">{FAILURE_MESSAGES[failure]}</p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
              Back to dashboard
            </Button>
            {failure === "timeout" && (
              <Button onClick={() => window.location.reload()}>Retry</Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!hasSyncedOnce && !preloadedDesign) return <FullScreenLoader label="Loading design" />;

  const toggleLayers = () => {
    setSideTab("properties");
    setShowSidePanel((v) => !v);
  };
  const hint = TOOL_HINTS[activeTool];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <EditorToolbar
        designName={designName}
        onNameChange={updateDesignName}
        onToggle3DPreview={() => setModal("preview")}
        onToggleShare={() => setModal("share")}
        onToggleHistory={() => setShowVersionHistory((v) => !v)}
        onToggleUpgrade={() => setModal("upgrade")}
        onToggleImport={() => setModal("import")}
        stageRef={stageRef}
        canEdit={canEdit}
        isOwner={isOwner}
      />

      <div className="flex flex-1 overflow-hidden">
        {canEdit && <ToolRail layout="desktop" onToggleLayers={toggleLayers} />}

        <div className="relative flex-1 bg-canvas" ref={canvasContainerRef}>
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
            {canEdit && showSidePanel && (
              <>
                <SidePanel
                  key="desktop"
                  layout="desktop"
                  tab={sideTab}
                  onTabChange={setSideTab}
                  onClose={() => setShowSidePanel(false)}
                />
                <SidePanel
                  key="mobile"
                  layout="mobile"
                  tab={sideTab}
                  onTabChange={setSideTab}
                  onClose={() => setShowSidePanel(false)}
                />
              </>
            )}
          </AnimatePresence>

          <ZoomControls onFit={fitCanvas} />

          {canEdit && <ToolRail layout="mobile" onToggleLayers={toggleLayers} />}

          <AnimatePresence>
            {hint && (
              <motion.div
                key={activeTool}
                className="absolute top-2 left-2 hidden rounded-lg border border-border bg-card/90 px-3 py-2 text-xs text-muted-foreground shadow-md backdrop-blur-sm sm:top-4 sm:left-4 sm:block"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {hint}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {canEdit && showVersionHistory && (
              <motion.div
                className="absolute top-0 right-0 bottom-0 z-30 w-80"
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

      <PreviewModal open={modal === "preview"} onClose={() => setModal(null)} />
      {isOwner && (
        <ShareModal
          open={modal === "share"}
          onClose={() => setModal(null)}
          designId={designId}
          designName={designName}
        />
      )}
      <UpgradeModal open={modal === "upgrade"} onClose={() => setModal(null)} />
      <ImportDesignModal open={modal === "import"} onClose={() => setModal(null)} />
      {canEdit && <DesignChat designId={designId} onUpgradeRequired={() => setModal("upgrade")} />}
    </div>
  );
};
