"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEditorModal } from "@/features/editor/use-editor-modal";
import { PreviewScene } from "./preview-scene";
import { DEFAULT_SETTINGS, PreviewOptionsPanel, type PreviewSettings } from "./preview-settings";

type PreviewModalProps = {
  open: boolean;
  onClose: () => void;
};

export const PreviewModal = ({ open, onClose }: PreviewModalProps) => {
  const [settings, setSettings] = useState<PreviewSettings>(DEFAULT_SETTINGS);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const { ambientPercent, ...sceneSettings } = settings;

  useEditorModal(open);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="flex h-dvh max-w-none flex-col rounded-none border-0 bg-background/98 p-0 shadow-none">
        <div className="flex items-center gap-3 border-b border-border/60 py-3 pr-12 pl-5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
            3D Preview
          </h2>
          <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
            Click and drag to orbit, scroll to zoom, right-click to pan
          </span>
        </div>

        <div className="relative min-h-0 flex-1">
          <Suspense fallback={<LoadingFallback />}>
            <PreviewScene {...sceneSettings} ambientIntensity={ambientPercent / 100} />
          </Suspense>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="absolute inset-x-2 bottom-2 z-20 sm:inset-x-auto sm:right-4 sm:bottom-4"
          >
            {panelCollapsed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPanelCollapsed(false)}
                className="border-border bg-card/90 text-muted-foreground backdrop-blur-md hover:bg-secondary hover:text-foreground"
              >
                View Options
              </Button>
            ) : (
              <PreviewOptionsPanel
                settings={settings}
                onChange={(patch) => setSettings((current) => ({ ...current, ...patch }))}
                onReset={() => setSettings(DEFAULT_SETTINGS)}
                onCollapse={() => setPanelCollapsed(true)}
              />
            )}
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading 3D scene...</p>
    </div>
  </div>
);
