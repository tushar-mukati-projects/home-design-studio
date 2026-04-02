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
  { color: "#4A4540", label: "Dark Brown" },
  { color: "#8B7355", label: "Wood" },
  { color: "#D4C5B2", label: "Light Oak" },
  { color: "#2C2C2C", label: "Dark Gray" },
  { color: "#E8DCC8", label: "Cream" },
  { color: "#654321", label: "Walnut" },
];

const WALL_PRESETS = [
  { color: "#F5EDE0", label: "Beige" },
  { color: "#FFFFFF", label: "White" },
  { color: "#E8E0D0", label: "Warm White" },
  { color: "#D5C4A1", label: "Sand" },
  { color: "#C9D6DF", label: "Light Blue" },
  { color: "#D4E6D4", label: "Light Green" },
];

const FURNITURE_PRESETS = [
  { color: "#8B7355", label: "Wood" },
  { color: "#2C2C2C", label: "Black" },
  { color: "#F5F5F5", label: "White" },
  { color: "#654321", label: "Dark Wood" },
  { color: "#B8860B", label: "Gold" },
  { color: "#4A6741", label: "Forest Green" },
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
      <span className="text-[10px] font-medium tracking-wider text-[#6b6b78] uppercase">
        {label}
      </span>
      <div className="mt-1.5 flex items-center gap-1.5">
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
                  ? "0 0 0 2px #1e293b, 0 0 0 3.5px #64748b"
                  : "0 0 0 1px rgba(255,255,255,0.1)",
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
            className="block h-6 w-6 rounded border border-[#334155] transition-transform hover:scale-110"
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
    <div className="flex h-full w-full items-center justify-center bg-[#0f172a]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#64748b] border-t-transparent" />
        <p className="text-sm text-[#6b6b78]">Loading 3D scene...</p>
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
  const [floorColor, setFloorColor] = useState("#4A4540");
  const [wallColor, setWallColor] = useState("#F5EDE0");
  const [furnitureColor, setFurnitureColor] = useState("#8B7355");

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
    setFloorColor("#4A4540");
    setWallColor("#F5EDE0");
    setFurnitureColor("#8B7355");
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
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-sm" />

          <div className="relative z-10 flex items-center justify-between border-b border-[#334155]/60 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#64748b]" />
              <h2 className="text-lg font-semibold tracking-tight text-[#f1f5f9]">3D Preview</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-[#6b6b78] sm:block">
                Click and drag to orbit, scroll to zoom, right-click to pan
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-[#6b6b78] hover:bg-[#1e293b] hover:text-[#f1f5f9]"
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
              className="absolute right-4 bottom-4 z-20"
            >
              {panelCollapsed ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPanelCollapsed(false)}
                  className="border-[#334155] bg-[#1e293b]/90 text-[#94a3b8] backdrop-blur-md hover:bg-[#1A1A1A] hover:text-[#f1f5f9]"
                >
                  View Options
                </Button>
              ) : (
                <div className="w-64 rounded-lg border border-[#334155] bg-[#1e293b]/90 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-[#334155]/60 px-3 py-2">
                    <span className="text-xs font-medium tracking-wider text-[#94a3b8] uppercase">
                      View Options
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleReset}
                        className="rounded p-1 text-[#6b6b78] transition-colors hover:text-[#64748b]"
                        title="Reset to defaults"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setPanelCollapsed(true)}
                        className="rounded p-1 text-[#6b6b78] transition-colors hover:text-[#f1f5f9]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 p-3">
                    <div>
                      <span className="text-[10px] font-medium tracking-wider text-[#6b6b78] uppercase">
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
                                  ? "bg-[#64748b]/15 text-[#64748b] ring-1 ring-[#64748b]/30"
                                  : "text-[#6b6b78] hover:bg-[#1e293b] hover:text-[#94a3b8]"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-[#334155]/40 pt-1">
                      <button
                        onClick={() => setShowFurniture((v) => !v)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-medium text-[#94a3b8] transition-colors hover:bg-[#1e293b]"
                      >
                        <span className="flex items-center gap-2">
                          {showFurniture ? (
                            <Eye className="h-3.5 w-3.5 text-[#64748b]" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5 text-[#6b6b78]" />
                          )}
                          Furniture
                        </span>
                        <span
                          className={`text-[10px] ${showFurniture ? "text-[#64748b]" : "text-[#6b6b78]"}`}
                        >
                          {showFurniture ? "ON" : "OFF"}
                        </span>
                      </button>

                      <button
                        onClick={() => setShowRoomColors((v) => !v)}
                        className="flex w-full items-center justify-between rounded px-2 py-1.5 text-[11px] font-medium text-[#94a3b8] transition-colors hover:bg-[#1e293b]"
                      >
                        <span className="flex items-center gap-2">
                          <Palette
                            className={`h-3.5 w-3.5 ${showRoomColors ? "text-[#64748b]" : "text-[#6b6b78]"}`}
                          />
                          Room Colors
                        </span>
                        <span
                          className={`text-[10px] ${showRoomColors ? "text-[#64748b]" : "text-[#6b6b78]"}`}
                        >
                          {showRoomColors ? "ON" : "OFF"}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-[#334155]/40 pt-1">
                      <div className="mb-1.5 flex items-center justify-between px-2">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-[#94a3b8]">
                          <Sun className="h-3.5 w-3.5 text-[#64748b]" />
                          Ambient Light
                        </span>
                        <span className="text-[10px] text-[#6b6b78]">{ambientIntensity}%</span>
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

                    <div className="space-y-3 border-t border-[#334155]/40 px-2 pt-1">
                      <div className="mb-1 flex items-center gap-2">
                        <Palette className="h-3.5 w-3.5 text-[#64748b]" />
                        <span className="text-[11px] font-medium text-[#94a3b8]">Colors</span>
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
