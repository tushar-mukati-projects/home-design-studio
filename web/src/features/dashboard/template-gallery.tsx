"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutTemplate, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchTemplates, useCreateFromTemplate } from "@/hooks/templates";
import { cn } from "@/lib/utils";
import type { DesignTemplate, Wall } from "@/types";

interface CategoryTab {
  label: string;
  value: string;
}

const CATEGORIES: CategoryTab[] = [
  { label: "All", value: "all" },
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Office", value: "office" },
];

interface TemplatePreviewProps {
  template: DesignTemplate;
}

const TemplatePreview = ({ template }: TemplatePreviewProps) => {
  const { width, height, canvasData } = template;
  const walls: Wall[] = canvasData?.walls ?? [];
  const rooms = canvasData?.rooms;
  const furniture = canvasData?.furniture;
  const aspectRatio = width / height;
  const svgWidth = 400;
  const svgHeight = svgWidth / aspectRatio;
  const scaleX = svgWidth / width;
  const scaleY = svgHeight / height;

  const ROOM_FILLS: Record<string, string> = {
    living_room: "#e8e8ec",
    bedroom: "#e4e0ec",
    kitchen: "#ece8e4",
    bathroom: "#e0e8ec",
    dining: "#ece8e0",
    office: "#e4ece4",
    hallway: "#f0f0f4",
    closet: "#eaeaee",
    generic: "#eaeaee",
  };

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="var(--secondary)" rx={4} />
      {rooms?.map((room) => {
        if (!room.points || room.points.length < 3) return null;
        const pts = room.points.map((p) => `${p.x * scaleX},${p.y * scaleY}`).join(" ");
        return (
          <polygon
            key={room.id}
            points={pts}
            fill={ROOM_FILLS[room.type] || ROOM_FILLS.generic}
            stroke="none"
          />
        );
      })}
      {walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.x1 * scaleX}
          y1={wall.y1 * scaleY}
          x2={wall.x2 * scaleX}
          y2={wall.y2 * scaleY}
          stroke={wall.color}
          strokeWidth={Math.max(wall.thickness * scaleX, 2)}
          strokeLinecap="round"
        />
      ))}
      {furniture?.map((f) => {
        const w = (f.furnitureItem?.width ?? 40) * (f.scaleX ?? 1) * scaleX;
        const h = (f.furnitureItem?.height ?? 40) * (f.scaleY ?? 1) * scaleY;
        return (
          <rect
            key={f.id}
            x={f.x * scaleX - w / 2}
            y={f.y * scaleY - h / 2}
            width={w}
            height={h}
            rx={2}
            fill="#b4b4bc"
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
};

const TemplateCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <CardContent className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-16" />
      </CardContent>
    </Card>
  );
};

interface TemplateCardProps {
  template: DesignTemplate;
  onUse: (template: DesignTemplate) => void;
  index: number;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.08,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const TemplateCard = ({ template, onUse, index }: TemplateCardProps) => {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={() => onUse(template)}
    >
      <Card className="group cursor-pointer overflow-hidden transition-colors hover:border-[var(--primary)]/50">
        <div className="h-36 overflow-hidden bg-[var(--secondary)]">
          <TemplatePreview template={template} />
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-[var(--foreground)]">{template.name}</h3>
              {template.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                  {template.description}
                </p>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs font-normal capitalize">
              {template.category}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              Use
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface TemplateGalleryProps {
  onPlanLimitReached?: () => void;
  designCount?: number;
  designLimit?: number | null;
}

export const TemplateGallery = ({
  onPlanLimitReached,
  designCount = 0,
  designLimit,
}: TemplateGalleryProps) => {
  const router = useRouter();
  const { data: templates, isLoading } = useFetchTemplates();
  const createFromTemplate = useCreateFromTemplate();
  const [activeCategory, setActiveCategory] = useState("all");
  const [creating, setCreating] = useState(false);

  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (activeCategory === "all") return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  const handleUseTemplate = async (template: DesignTemplate) => {
    if (
      designLimit !== null &&
      designLimit !== undefined &&
      isFinite(designLimit) &&
      designCount >= designLimit
    ) {
      onPlanLimitReached?.();
      return;
    }
    if (creating) return;
    setCreating(true);
    try {
      const design = await createFromTemplate.mutateAsync({
        templateId: template.id,
        name: `${template.name} Design`,
      });
      toast.success("Design created from template");
      router.push(`/editor/${design.id}`);
    } catch {
      toast.error("Failed to create design from template");
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <LayoutTemplate className="h-5 w-5 text-[var(--primary)]" />
        <h2
          className="text-xl text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Start from a Template
        </h2>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-md border border-[var(--border)] p-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "rounded-sm px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              activeCategory === cat.value
                ? "bg-[var(--secondary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">
          No templates in this category
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUseTemplate}
              index={index}
            />
          ))}
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
            <p className="text-sm font-medium text-[var(--foreground)]">Creating design...</p>
          </div>
        </div>
      )}
    </div>
  );
};
