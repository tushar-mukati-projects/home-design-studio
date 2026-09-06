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
import type { DesignTemplate } from "@/types";
import { ROOM_USAGE_COLORS, boundsOf } from "@/lib/canvas";

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
  const canvas = template.canvasData;
  const bounds = boundsOf(canvas);
  const pad = 300;
  const minX = (bounds?.minX ?? 0) - pad;
  const minY = (bounds?.minY ?? 0) - pad;
  const width = bounds ? bounds.maxX - bounds.minX + pad * 2 : 8000;
  const height = bounds ? bounds.maxY - bounds.minY + pad * 2 : 6000;

  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={minX} y={minY} width={width} height={height} fill="var(--secondary)" />
      {canvas.rooms.map((room) => (
        <polygon
          key={room.id}
          points={room.polygon.map((p) => p.join(",")).join(" ")}
          fill={ROOM_USAGE_COLORS[room.usage] ?? ROOM_USAGE_COLORS.generic}
          opacity={0.18}
        />
      ))}
      {canvas.walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.from[0]}
          y1={wall.from[1]}
          x2={wall.to[0]}
          y2={wall.to[1]}
          stroke={wall.color ?? "#52525b"}
          strokeWidth={Math.max(wall.thickness, 40)}
          strokeLinecap="round"
        />
      ))}
      {canvas.furniture.map((f) => {
        const [w, d] = f.size ?? [800, 600];
        return (
          <rect
            key={f.id}
            x={f.at[0] - w / 2}
            y={f.at[1] - d / 2}
            width={w}
            height={d}
            rx={40}
            fill="#b4b4bc"
            opacity={0.5}
            transform={`rotate(${f.rotation} ${f.at[0]} ${f.at[1]})`}
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
