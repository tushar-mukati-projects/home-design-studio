"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { EASE_OUT } from "@/features/landing/motion";
import { cn } from "@/lib/utils";
import type { DesignListItem, DesignListResponse } from "@/types";
import { DesignCard, type DesignActions, type DesignCardVariant } from "./design-card";

export type ViewMode = "grid" | "list";

type DesignGridProps = {
  page: DesignListResponse;
  viewMode: ViewMode;
  onPageChange: (offset: number) => void;
  onOpen: (design: DesignListItem) => void;
  actions: DesignActions;
};

type PagerProps = {
  page: DesignListResponse;
  onPageChange: (offset: number) => void;
};

const CARD_STAGGER_S = 0.08;

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * CARD_STAGGER_S, ease: EASE_OUT },
  }),
};

export const gridClass = (viewMode: ViewMode) =>
  cn(
    "grid gap-5",
    viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
  );

export const DesignGrid = ({ page, viewMode, onPageChange, onOpen, actions }: DesignGridProps) => (
  <>
    <AnimatePresence mode="wait">
      <motion.div
        key={viewMode}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={gridClass(viewMode)}
      >
        {page.designs.map((design, index) => (
          <motion.div
            key={design.id}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <DesignCard
              design={design}
              variant={viewMode satisfies DesignCardVariant}
              onOpen={onOpen}
              actions={actions}
            />
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
    {page.total > page.limit && <Pager page={page} onPageChange={onPageChange} />}
  </>
);

const Pager = ({ page, onPageChange }: PagerProps) => {
  const first = page.offset + 1;
  const last = page.offset + page.designs.length;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Showing {first}–{last} of {page.total}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page.offset === 0}
          onClick={() => onPageChange(Math.max(0, page.offset - page.limit))}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={last >= page.total}
          onClick={() => onPageChange(page.offset + page.limit)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
