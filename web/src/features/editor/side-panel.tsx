"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { FurnitureCatalog } from "./furniture-catalog/furniture-catalog";
import { PropertiesPanel } from "./properties-panel/properties-panel";

export type SidePanelTab = "properties" | "furniture";

type SidePanelProps = {
  layout: "desktop" | "mobile";
  tab: SidePanelTab;
  onTabChange: (tab: SidePanelTab) => void;
  onClose: () => void;
};

type PanelTabProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const TABS: [SidePanelTab, string][] = [
  ["properties", "Properties"],
  ["furniture", "Furniture"],
];

const PANEL_TRANSITION = { duration: 0.25, ease: "easeOut" } as const;

export const SidePanel = ({ layout, tab, onTabChange, onClose }: SidePanelProps) => {
  const desktop = layout === "desktop";
  return (
    <motion.div
      className={cn(
        "absolute z-20 overflow-hidden border-border bg-card",
        desktop
          ? "top-4 right-4 hidden max-h-[calc(100%-5rem)] w-70 rounded-xl border shadow-xl md:block"
          : "inset-x-0 bottom-0 max-h-[55vh] rounded-t-2xl border-t shadow-2xl md:hidden",
      )}
      initial={desktop ? { opacity: 0, x: 20 } : { opacity: 0, y: 100 }}
      animate={desktop ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 }}
      exit={desktop ? { opacity: 0, x: 20 } : { opacity: 0, y: 100 }}
      transition={PANEL_TRANSITION}
    >
      <div className="flex h-10 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-1">
          {TABS.map(([id, label]) => (
            <PanelTab key={id} active={tab === id} onClick={() => onTabChange(id)}>
              {label}
            </PanelTab>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div
        className={cn(
          "overflow-x-hidden overflow-y-auto",
          desktop ? "max-h-[calc(100vh-12.5rem)]" : "max-h-[calc(55vh-2.5rem)]",
        )}
      >
        {tab === "properties" ? <PropertiesPanel /> : <FurnitureCatalog />}
      </div>
    </motion.div>
  );
};

const PanelTab = ({ active, onClick, children }: PanelTabProps) => (
  <button
    onClick={onClick}
    className={cn(
      "rounded px-2 py-1 text-2xs font-semibold tracking-wider uppercase transition-colors",
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
  </button>
);
