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
import type { FurnitureItem } from "@/types";

const CATEGORY_ICONS: Record<string, Record<string, LucideIcon>> = {
  "living-room": {
    sofa: Sofa,
    armchair: Armchair,
    "coffee-table": Table,
    "tv-stand": Tv,
    bookshelf: BookOpen,
    "floor-lamp": Lamp,
  },
  bedroom: {
    "double-bed": BedDouble,
    "single-bed": BedSingle,
    nightstand: LampDesk,
    wardrobe: DoorOpen,
    dresser: Archive,
    desk: Table2,
  },
  kitchen: {
    "dining-table": UtensilsCrossed,
    "dining-chair": ChefHat,
    "kitchen-island": Microwave,
    refrigerator: Refrigerator,
    stove: Flame,
  },
  bathroom: {
    bathtub: Bath,
    toilet: Droplets,
    sink: Waves,
    shower: Droplet,
  },
  office: {
    "office-desk": Monitor,
    "office-chair": Armchair,
    "filing-cabinet": Archive,
    bookcase: BookOpen,
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  office: "Office",
};

const getItemIcon = (item: FurnitureItem): LucideIcon => {
  const categoryIcons = CATEGORY_ICONS[item.category];
  if (categoryIcons && categoryIcons[item.id]) {
    return categoryIcons[item.id];
  }
  return PackageOpen;
};

interface FurnitureCardProps {
  item: FurnitureItem;
  onQuickAdd: (item: FurnitureItem) => void;
}

export const FurnitureCard = ({ item, onQuickAdd }: FurnitureCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const icon = getItemIcon(item);

  const maxPreviewDim = 80;
  const aspectRatio = item.width / item.height;
  let previewWidth: number;
  let previewHeight: number;

  if (aspectRatio >= 1) {
    previewWidth = maxPreviewDim;
    previewHeight = maxPreviewDim / aspectRatio;
  } else {
    previewHeight = maxPreviewDim;
    previewWidth = maxPreviewDim * aspectRatio;
  }

  previewWidth = Math.max(previewWidth, 32);
  previewHeight = Math.max(previewHeight, 32);

  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.dataTransfer.setData("application/json", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Tooltip content={`${item.name} - Click to quick-add`} side="top">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={() => onQuickAdd(item)}
      >
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "group relative flex cursor-grab flex-col items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm transition-all duration-200",
            "hover:border-[#2c2c2e]/60 hover:shadow-md hover:shadow-[#2c2c2e]/5",
            isDragging && "opacity-50 shadow-none",
          )}
        >
          <div className="flex h-[88px] w-full items-center justify-center rounded-md bg-[var(--muted)]">
            <div
              className="relative flex items-center justify-center rounded-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                width: `${previewWidth}px`,
                height: `${previewHeight}px`,
                backgroundColor: item.color,
              }}
            >
              {createElement(icon, {
                className: "text-white/80 drop-shadow-sm",
                size: Math.min(previewWidth, previewHeight) * 0.5,
                strokeWidth: 1.5,
              })}
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-1">
            <span className="text-center text-sm leading-tight font-medium text-[var(--foreground)]">
              {item.name}
            </span>
            <span className="text-xs text-[var(--muted-foreground)]">
              {item.width} &times; {item.height} cm
            </span>
            <Badge variant="secondary" className="mt-0.5 px-1.5 py-0 text-[10px] font-normal">
              {CATEGORY_LABELS[item.category] ?? item.category}
            </Badge>
          </div>
        </motion.div>
      </div>
    </Tooltip>
  );
};
