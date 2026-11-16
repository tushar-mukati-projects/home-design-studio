"use client";

import { motion } from "framer-motion";
import { Armchair, Circle, Minus, MousePointerClick, PenTool, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { INK, gridLines } from "./landing-colors";
import { MockupPlan } from "./mockup-plan";
import { scaleIn } from "./motion";

const CANVAS_GRID_PX = 24;

const TOOLS = [
  { name: "select", icon: MousePointerClick, active: false },
  { name: "draw", icon: PenTool, active: true },
  { name: "room", icon: Square, active: false },
  { name: "wall", icon: Minus, active: false },
  { name: "circle", icon: Circle, active: false },
  { name: "furniture", icon: Armchair, active: false },
];

const PROPERTIES = [
  { label: "Room", value: "Living Room" },
  { label: "Area", value: "19.76 m²" },
  { label: "Walls", value: "6 segments" },
];

const FURNITURE_CHIPS = [
  { icon: Armchair, label: "Sofa" },
  { icon: Square, label: "Coffee Table" },
];

export const EditorMockup = () => (
  <motion.div
    variants={scaleIn}
    custom={3}
    className="relative mx-auto mt-12 w-full max-w-4xl lg:mt-16"
  >
    <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-3xl" />

    <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-foreground/10">
      <div className="flex items-center gap-2 border-b border-border bg-primary px-4 py-3">
        <span className="size-3 rounded-full bg-destructive" />
        <span className="size-3 rounded-full bg-primary/60" />
        <span className="size-3 rounded-full bg-success opacity-60" />
        <span className="ml-3 text-xs text-muted-foreground">
          Home Design Studio — My Living Room
        </span>
      </div>
      <div className="flex h-64 sm:h-80 lg:h-96">
        <div className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-border bg-primary py-4">
          {TOOLS.map(({ name, icon: Icon, active }) => (
            <Icon
              key={name}
              className={cn("size-4", active ? "text-primary" : "text-muted-foreground")}
            />
          ))}
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: gridLines(INK, CANVAS_GRID_PX) }}
          />
          <MockupPlan />
        </div>
        <PropertiesPanel />
      </div>
    </div>
  </motion.div>
);

const PropertiesPanel = () => (
  <div className="hidden w-48 shrink-0 border-l border-border bg-primary p-4 lg:block">
    <p className="text-2xs font-semibold tracking-widest text-muted-foreground uppercase">
      Properties
    </p>
    <div className="mt-4 space-y-3">
      {PROPERTIES.map((property) => (
        <div key={property.label}>
          <span className="text-2xs text-muted-foreground">{property.label}</span>
          <p className="text-xs text-foreground">{property.value}</p>
        </div>
      ))}
      <div className="pt-2">
        <span className="text-2xs text-muted-foreground">Furniture</span>
        <div className="mt-1 space-y-1">
          {FURNITURE_CHIPS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 rounded bg-secondary px-2 py-1 text-2xs text-foreground"
            >
              <Icon className="size-3 text-primary" /> {label}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-2xs text-muted-foreground">3D Preview</span>
          <div className="flex h-4 w-8 items-center rounded-full bg-primary/20 px-0.5">
            <motion.div
              className="size-3 rounded-full bg-primary"
              animate={{ x: [0, 12, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);
