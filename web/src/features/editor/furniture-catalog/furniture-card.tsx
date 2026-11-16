"use client";

import { useState, type DragEvent, createElement } from "react";
import { motion } from "framer-motion";
import {
  Sofa,
  Armchair,
  Table,
  Tv,
  BookOpen,
  Lamp,
  BedDouble,
  BedSingle,
  LampDesk,
  DoorOpen,
  Archive,
  Table2,
  UtensilsCrossed,
  ChefHat,
  Microwave,
  Refrigerator,
  Flame,
  Bath,
  Droplets,
  Waves,
  Droplet,
  Monitor,
  PackageOpen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import type { CatalogItem } from "@/shared/canvas";
import { ROOM_USAGE_LABELS } from "@/lib/canvas";
import { CATALOG_ITEM_DRAG_TYPE, metres } from "@/lib/constants";

const PREVIEW_MAX_PX = 80;
const PREVIEW_MIN_PX = 32;
const PREVIEW_ICON_SCALE = 0.5;
const SIZE_DIGITS = 1;

const ICONS: Record<string, LucideIcon> = {
  sofa: Sofa,
  armchair: Armchair,
  "coffee-table": Table,
  "tv-stand": Tv,
  bookshelf: BookOpen,
  "floor-lamp": Lamp,
  "double-bed": BedDouble,
  "single-bed": BedSingle,
  nightstand: LampDesk,
  wardrobe: DoorOpen,
  dresser: Archive,
  desk: Table2,
  "dining-table": UtensilsCrossed,
  "dining-chair": ChefHat,
  "kitchen-island": Microwave,
  refrigerator: Refrigerator,
  stove: Flame,
  bathtub: Bath,
  toilet: Droplets,
  sink: Waves,
  shower: Droplet,
  "office-desk": Monitor,
  "office-chair": Armchair,
  "filing-cabinet": Archive,
  bookcase: BookOpen,
};

type FurnitureCardProps = {
  item: CatalogItem;
  onQuickAdd: (item: CatalogItem) => void;
};

export const FurnitureCard = ({ item, onQuickAdd }: FurnitureCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const icon = ICONS[item.id] ?? PackageOpen;
  const [width, depth] = item.size;

  const aspectRatio = width / depth;
  const previewWidth = Math.max(
    aspectRatio >= 1 ? PREVIEW_MAX_PX : PREVIEW_MAX_PX * aspectRatio,
    PREVIEW_MIN_PX,
  );
  const previewHeight = Math.max(
    aspectRatio >= 1 ? PREVIEW_MAX_PX / aspectRatio : PREVIEW_MAX_PX,
    PREVIEW_MIN_PX,
  );

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData(CATALOG_ITEM_DRAG_TYPE, item.id);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <Tooltip content={`${item.name} - Click to add`} side="top">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={() => setIsDragging(false)}
        onClick={() => onQuickAdd(item)}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group relative flex cursor-grab flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200",
            "hover:border-primary/60 hover:shadow-md hover:shadow-primary/5",
            isDragging && "opacity-50 shadow-none",
          )}
        >
          <div className="flex h-22 w-full items-center justify-center rounded-md bg-muted">
            <div
              className="relative flex items-center justify-center rounded-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                backgroundColor: item.color,
              }}
            >
              {createElement(icon, {
                className: "text-primary-foreground/80 drop-shadow-sm",
                size: Math.min(previewWidth, previewHeight) * PREVIEW_ICON_SCALE,
                strokeWidth: 1.5,
              })}
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-1">
            <span className="text-center text-sm leading-tight font-medium text-foreground">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {metres(width, SIZE_DIGITS)} &times; {metres(depth, SIZE_DIGITS)} m
            </span>
            <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-2xs font-normal">
              {ROOM_USAGE_LABELS[item.category]}
            </Badge>
          </div>
        </motion.div>
      </div>
    </Tooltip>
  );
};
