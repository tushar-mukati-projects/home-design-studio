"use client";

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
  type LucideIcon,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { CameraPresetId } from "./camera-presets";

type ColorPreset = {
  color: string;
  label: string;
};

type CameraOption = { id: CameraPresetId; label: string; icon: LucideIcon };

export type PreviewSettings = {
  cameraPreset: CameraPresetId;
  showFurniture: boolean;
  showRoomColors: boolean;
  ambientPercent: number;
  floorColor: string;
  wallColor: string;
  furnitureColor: string;
};

type PreviewOptionsPanelProps = {
  settings: PreviewSettings;
  onChange: (patch: Partial<PreviewSettings>) => void;
  onReset: () => void;
  onCollapse: () => void;
};

type ColorPickerRowProps = {
  label: string;
  presets: readonly ColorPreset[];
  value: string;
  onChange: (color: string) => void;
};

const FLOOR_PRESETS = [
  { color: "#8a8a8f", label: "Concrete" },
  { color: "#a08060", label: "Light Wood" },
  { color: "#6b5b4e", label: "Dark Wood" },
  { color: "#b0a898", label: "Sandstone" },
  { color: "#505058", label: "Dark Slate" },
  { color: "#c8b8a8", label: "Travertine" },
] as const;

const WALL_PRESETS = [
  { color: "#e8e8e8", label: "White" },
  { color: "#d8d0c8", label: "Warm White" },
  { color: "#c8d0d8", label: "Cool Gray" },
  { color: "#d0c8b8", label: "Cream" },
  { color: "#b8c8c8", label: "Sage" },
  { color: "#c8c0b8", label: "Linen" },
] as const;

const FURNITURE_PRESETS = [
  { color: "#909098", label: "Gray" },
  { color: "#6b5b4e", label: "Walnut" },
  { color: "#e0e0e0", label: "White" },
  { color: "#404048", label: "Charcoal" },
  { color: "#a08868", label: "Oak" },
  { color: "#28282e", label: "Black" },
] as const;

const CAMERA_OPTIONS: CameraOption[] = [
  { id: "corner", label: "Corner View", icon: Compass },
  { id: "top", label: "Top View", icon: ArrowUp },
  { id: "front", label: "Front View", icon: Eye },
  { id: "walkthrough", label: "Walkthrough", icon: Footprints },
];

const AMBIENT_MIN_PERCENT = 10;
const AMBIENT_MAX_PERCENT = 100;
const AMBIENT_STEP_PERCENT = 5;

export const DEFAULT_SETTINGS: PreviewSettings = {
  cameraPreset: "corner",
  showFurniture: true,
  showRoomColors: true,
  ambientPercent: 60,
  floorColor: FLOOR_PRESETS[0].color,
  wallColor: WALL_PRESETS[0].color,
  furnitureColor: FURNITURE_PRESETS[0].color,
};

export const PreviewOptionsPanel = ({
  settings,
  onChange,
  onReset,
  onCollapse,
}: PreviewOptionsPanelProps) => (
  <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-border bg-card/90 shadow-2xl backdrop-blur-md sm:max-h-none sm:w-64 sm:overflow-y-visible">
    <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
      <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        View Options
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-primary"
          title="Reset to defaults"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onCollapse}
          className="rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <div className="space-y-3 p-3">
      <div>
        <span className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
          Camera
        </span>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          {CAMERA_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = settings.cameraPreset === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onChange({ cameraPreset: opt.id })}
                className={cn(
                  "flex items-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-primary/15 text-primary ring-1 ring-ring/30"
                    : "text-muted-foreground hover:bg-secondary hover:text-muted-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2 border-t border-border/40 pt-1">
        <button
          onClick={() => onChange({ showFurniture: !settings.showFurniture })}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2">
            {settings.showFurniture ? (
              <Eye className="h-3.5 w-3.5 text-primary" />
            ) : (
              <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            Furniture
          </span>
          <span
            className={cn(
              "text-2xs",
              settings.showFurniture ? "text-primary" : "text-muted-foreground",
            )}
          >
            {settings.showFurniture ? "ON" : "OFF"}
          </span>
        </button>

        <button
          onClick={() => onChange({ showRoomColors: !settings.showRoomColors })}
          className="flex w-full items-center justify-between rounded px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <span className="flex items-center gap-2">
            <Palette
              className={cn(
                "h-3.5 w-3.5",
                settings.showRoomColors ? "text-primary" : "text-muted-foreground",
              )}
            />
            Room Colors
          </span>
          <span
            className={cn(
              "text-2xs",
              settings.showRoomColors ? "text-primary" : "text-muted-foreground",
            )}
          >
            {settings.showRoomColors ? "ON" : "OFF"}
          </span>
        </button>
      </div>

      <div className="border-t border-border/40 pt-1">
        <div className="mb-1.5 flex items-center justify-between px-2">
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Sun className="h-3.5 w-3.5 text-primary" />
            Ambient Light
          </span>
          <span className="text-2xs text-muted-foreground">{settings.ambientPercent}%</span>
        </div>
        <div className="px-2">
          <Slider
            min={AMBIENT_MIN_PERCENT}
            max={AMBIENT_MAX_PERCENT}
            step={AMBIENT_STEP_PERCENT}
            value={settings.ambientPercent}
            onValueChange={(ambientPercent) => onChange({ ambientPercent })}
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 px-2 pt-1">
        <div className="mb-1 flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Colors</span>
        </div>
        <ColorPickerRow
          label="Floor"
          presets={FLOOR_PRESETS}
          value={settings.floorColor}
          onChange={(floorColor) => onChange({ floorColor })}
        />
        <ColorPickerRow
          label="Walls"
          presets={WALL_PRESETS}
          value={settings.wallColor}
          onChange={(wallColor) => onChange({ wallColor })}
        />
        <ColorPickerRow
          label="Furniture"
          presets={FURNITURE_PRESETS}
          value={settings.furnitureColor}
          onChange={(furnitureColor) => onChange({ furnitureColor })}
        />
      </div>
    </div>
  </div>
);

const ColorPickerRow = ({ label, presets, value, onChange }: ColorPickerRowProps) => (
  <div>
    <span className="text-2xs font-medium tracking-wider text-muted-foreground uppercase">
      {label}
    </span>
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {presets.map((preset) => (
        <button
          key={preset.color}
          onClick={() => onChange(preset.color)}
          title={preset.label}
          className={cn(
            "h-6 w-6 shrink-0 rounded-full ring-offset-2 transition-transform hover:scale-110",
            value === preset.color && "ring-2 ring-ring",
          )}
          style={{ backgroundColor: preset.color }}
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
          className="block h-6 w-6 rounded border border-border transition-transform hover:scale-110"
          style={{ backgroundColor: value }}
        />
      </label>
    </div>
  </div>
);
