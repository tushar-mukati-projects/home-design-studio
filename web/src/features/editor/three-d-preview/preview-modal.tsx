"use client";

import { useState, useCallback, useEffect, useSyncExternalStore, Suspense } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Eye,
  EyeOff,
  Palette,
  Sun,
  RotateCcw,
  ArrowUp,
  Compass,
  Footprints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PreviewScene } from "./preview-scene";

const FLOOR_PRESETS = [
  { color: "#8a8a8f", label: "Concrete" },
  { color: "#a08060", label: "Light Wood" },
  { color: "#6b5b4e", label: "Dark Wood" },
  { color: "#b0a898", label: "Sandstone" },
  { color: "#505058", label: "Dark Slate" },
  { color: "#c8b8a8", label: "Travertine" },
];

const WALL_PRESETS = [
  { color: "#e8e8e8", label: "White" },
  { color: "#d8d0c8", label: "Warm White" },
  { color: "#c8d0d8", label: "Cool Gray" },
  { color: "#d0c8b8", label: "Cream" },
  { color: "#b8c8c8", label: "Sage" },
  { color: "#c8c0b8", label: "Linen" },
];

const FURNITURE_PRESETS = [
  { color: "#909098", label: "Gray" },
  { color: "#6b5b4e", label: "Walnut" },
  { color: "#e0e0e0", label: "White" },
  { color: "#404048", label: "Charcoal" },
  { color: "#a08868", label: "Oak" },
  { color: "#28282e", label: "Black" },
];

interface ColorPreset {
  color: string;
  label: string;
}

interface ColorPickerRowProps {
  label: string;
  presets: ColorPreset[];
  value: string;
  onChange: (color: string) => void;
}

const ColorPickerRow = ({ label, presets, value, onChange }: ColorPickerRowProps) => {
  return (
    <div>
      <span className="text-[10px] font-medium tracking-wider text-[#71717a] uppercase">
        {label}
      </span>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {presets.map((preset) => (
          <button
            key={preset.color}
            onClick={() => onChange(preset.color)}
            title={preset.label}
            className="h-6 w-6 shrink-0 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: preset.color,
              boxShadow:
                value === preset.color
                  ? "0 0 0 2px #ffffff, 0 0 0 3.5px #2c2c2e"
                  : "0 0 0 1px rgba(0,0,0,0.08)",
            }}
          />
        ))}
        <label className="relative h-6 w-6 shrink-0 cursor-pointer">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
          <span
            className="block h-6 w-6 rounded border border-[#e4e4e7] transition-transform hover:scale-110"
            style={{ backgroundColor: value }}
          />
        </label>
      </div>
    </div>
  );
};

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
}

const CAMERA_OPTIONS = [
  { id: "corner", label: "Corner View", icon: Compass },
  { id: "top", label: "Top View", icon: ArrowUp },
  { id: "front", label: "Front View", icon: Eye },
  { id: "walkthrough", label: "Walkthrough", icon: Footprints },
] as const;

const LoadingFallback = () => {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f5f6f8]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2c2c2e] border-t-transparent" />
        <p className="text-sm text-[#71717a]">Loading 3D scene...</p>
      </div>
    </div>
  );
};

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export const PreviewModal = ({ open, onClose }: PreviewModalProps) => {
  const mounted = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [cameraPreset, setCameraPreset] = useState("corner");
  const [showFurniture, setShowFurniture] = useState(true);
  const [showRoomColors, setShowRoomColors] = useState(true);
  const [ambientIntensity, setAmbientIntensity] = useState(60);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [floorColor, setFloorColor] = useState("#8a8a8f");
  const [wallColor, setWallColor] = useState("#e8e8e8");
  const [furnitureColor, setFurnitureColor] = useState("#909098");

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleReset = useCallback(() => {
    setCameraPreset("corner");
    setShowFurniture(true);
    setShowRoomColors(true);
    setAmbientIntensity(60);
    setFloorColor("#8a8a8f");
    setWallColor("#e8e8e8");
    setFurnitureColor("#909098");
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex flex-col"
        >
          <div className="absolute inset-0 bg-[#f5f6f8]/98 backdrop-blur-sm" />

          <div className="relative z-10 flex items-center justify-between border-b border-[#e4e4e7]/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#2c2c2e]" />
              <h2 className="text-base font-semibold tracking-tight text-[#18181b] sm:text-lg">
                3D Preview
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-[#71717a] sm:block">
                Click and drag to orbit, scroll to zoom, right-click to pan
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#18181b]"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1">
            <Suspense fallback={<LoadingFallback />}>
              <PreviewScene
                cameraPreset={cameraPreset}
                showFurniture={showFurniture}
                showRoomColors={showRoomColors}
                ambientIntensity={ambientIntensity / 100}
                floorColor={floorColor}
                wallColor={wallColor}
                furnitureColor={furnitureColor}
              />
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
                  className="border-[#e4e4e7] bg-[#ffffff]/90 text-[#71717a] backdrop-blur-md hover:bg-[#f4f4f5] hover:text-[#18181b]"
                >
                  View Options
                </Button>
              ) : (
                <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-[#e4e4e7] bg-[#ffffff]/90 shadow-2xl backdrop-blur-md sm:max-h-none sm:w-64 sm:overflow-y-visible">
                  <div className="flex items-center justify-between border-b border-[#e4e4e7]/60 px-3 py-2">
                    <span className="text-xs font-medium tracking-wider text-[#71717a] uppercase">
                      View Options
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleReset}
                        className="rounded p-1 text-[#71717a] transition-colors hover:text-[#2c2c2e]"
                        title="Reset to defaults"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setPanelCollapsed(true)}
                        className="rounded p-1 text-[#71717a] transition-colors hover:text-[#18181b]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    <div>
                      <span className="text-[10px] font-medium tracking-wider text-[#71717a] uppercase">
                        Camera
                      </span>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                        {CAMERA_OPTIONS.map((opt) => {
                          const Icon = opt.icon;
                          const active = cameraPreset === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => setCameraPreset(opt.id)}
                              className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[11px] font-medium transition-all ${
                                active
                                  ? "bg-[#2c2c2e]/15 text-[#2c2c2e] ring-1 ring-[#2c2c2e]/30"
                                  : "text-[#71717a] hover:bg-[#f4f4f5] hover:text-[#71717a]"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-[#e4e4e7]/40 pt-1">
                      <button
                        onClick={() => setShowFurniture((v) => !v)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-medium text-[#71717a] transition-colors hover:bg-[#f4f4f5]"
                      >
                        <span className="flex items-center gap-2">
                          {showFurniture ? (
                            <Eye className="h-3.5 w-3.5 text-[#2c2c2e]" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-[#71717a]" />
                          )}
                          Furniture
                        </span>
                        <span
                          className={`text-[10px] ${showFurniture ? "text-[#2c2c2e]" : "text-[#71717a]"}`}
                        >
                          {showFurniture ? "ON" : "OFF"}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowRoomColors((v) => !v)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-medium text-[#71717a] transition-colors hover:bg-[#f4f4f5]"
                      >
                        <span className="flex items-center gap-2">
                          <Palette
                            className={`h-3.5 w-3.5 ${showRoomColors ? "text-[#2c2c2e]" : "text-[#71717a]"}`}
                          />
                          Room Colors
                        </span>
                        <span
                          className={`text-[10px] ${showRoomColors ? "text-[#2c2c2e]" : "text-[#71717a]"}`}
                        >
                          {showRoomColors ? "ON" : "OFF"}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-[#e4e4e7]/40 pt-1">
                      <div className="mb-1.5 flex items-center justify-between px-2">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-[#71717a]">
                          <Sun className="h-3.5 w-3.5 text-[#2c2c2e]" />
                          Ambient Light
                        </span>
                        <span className="text-[10px] text-[#71717a]">{ambientIntensity}%</span>
                      </div>
                      <div className="px-2">
                        <Slider
                          min={10}
                          max={100}
                          step={5}
                          value={ambientIntensity}
                          onValueChange={setAmbientIntensity}
                        />
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-[#e4e4e7]/40 px-2 pt-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-[#2c2c2e]" />
                        <span className="text-[11px] font-medium text-[#71717a]">Colors</span>
                      </div>
                      <ColorPickerRow
                        label="Floor"
                        presets={FLOOR_PRESETS}
                        value={floorColor}
                        onChange={setFloorColor}
                      />
                      <ColorPickerRow
                        label="Walls"
                        presets={WALL_PRESETS}
                        value={wallColor}
                        onChange={setWallColor}
                      />
                      <ColorPickerRow
                        label="Furniture"
                        presets={FURNITURE_PRESETS}
                        value={furnitureColor}
                        onChange={setFurnitureColor}
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
