"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QueryError } from "@/components/ui/query-error";
import { SegmentedTabs, type SegmentedTab } from "@/components/ui/segmented-tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchTemplates } from "@/hooks/templates/useFetchTemplates";
import { cn } from "@/lib/utils";
import type { DesignTemplate } from "@/types";
import { CanvasPreview } from "./canvas-preview";
import { cardVariants } from "./design-grid";

type TemplatePickerProps = {
  selectedId: string | null;
  onPick: (template: DesignTemplate) => void;
  columns: "two" | "four";
};

type TemplateCardProps = {
  template: DesignTemplate;
  selected: boolean;
  onPick: (template: DesignTemplate) => void;
  index: number;
};

const CATEGORIES: SegmentedTab<string>[] = [
  { label: "All", value: "all" },
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Office", value: "office" },
];

const SKELETON_COUNT = 4;

const COLUMN_CLASSES = {
  two: "grid-cols-1 sm:grid-cols-2",
  four: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} satisfies Record<TemplatePickerProps["columns"], string>;

export const TemplatePicker = ({ selectedId, onPick, columns }: TemplatePickerProps) => {
  const templates = useFetchTemplates();
  const [category, setCategory] = useState("all");
  const visible = (templates.data ?? []).filter(
    (t) => category === "all" || t.category === category,
  );

  return (
    <div className="flex flex-col gap-4">
      <SegmentedTabs
        tabs={CATEGORIES}
        value={category}
        onChange={setCategory}
        className="overflow-x-auto"
        tabClassName="whitespace-nowrap"
      />

      {templates.isError ? (
        <QueryError
          error={templates.error}
          onRetry={() => templates.refetch()}
          retrying={templates.isFetching}
        />
      ) : templates.isLoading ? (
        <div className={cn("grid gap-4", COLUMN_CLASSES[columns])}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No templates in this category
        </p>
      ) : (
        <div className={cn("grid gap-4", COLUMN_CLASSES[columns])}>
          {visible.map((template, index) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={template.id === selectedId}
              onPick={onPick}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TemplateCardSkeleton = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-36 w-full rounded-none" />
    <CardContent className="space-y-2 p-4">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-5 w-16" />
    </CardContent>
  </Card>
);

const TemplateCard = ({ template, selected, onPick, index }: TemplateCardProps) => (
  <motion.div
    custom={index}
    variants={cardVariants}
    initial="hidden"
    animate="visible"
    onClick={() => onPick(template)}
  >
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-colors hover:border-primary/50",
        selected && "border-primary bg-primary/5",
      )}
    >
      <div className="h-36 overflow-hidden bg-secondary">
        <CanvasPreview canvas={template.canvasData} />
      </div>
      <CardContent className="p-4">
        <h3 className="truncate font-semibold text-foreground">{template.name}</h3>
        {template.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="secondary" className="text-xs font-normal capitalize">
            {template.category}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
          >
            Use
            <ArrowRight className="size-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);
