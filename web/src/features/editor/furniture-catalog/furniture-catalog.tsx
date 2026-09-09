"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PackageOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditorStore } from "@/stores/editor-store";
import { useFetchFurniture } from "@/hooks/furniture";
import { FURNITURE_CATEGORIES, type CatalogItem, type FurnitureCategory } from "@/types";
import { ROOM_USAGE_LABELS, boundsOf, newId } from "@/lib/canvas";
import { FurnitureCard } from "./furniture-card";

type CategoryFilter = FurnitureCategory | "all";

const CATEGORY_TABS: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  ...FURNITURE_CATEGORIES.map((id) => ({ id, label: ROOM_USAGE_LABELS[id] })),
];

export const FurnitureCatalog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const addFurniture = useEditorStore((s) => s.addFurniture);
  const { data: catalog = [], isLoading } = useFetchFurniture();

  const filteredItems = useMemo(() => {
    let items = catalog;
    if (activeCategory !== "all") items = items.filter((item) => item.category === activeCategory);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return items;
  }, [catalog, activeCategory, search]);

  const handleQuickAdd = useCallback(
    (item: CatalogItem) => {
      const state = useEditorStore.getState();
      const bounds = boundsOf(state);
      const at: [number, number] = bounds
        ? [Math.round((bounds.minX + bounds.maxX) / 2), Math.round((bounds.minY + bounds.maxY) / 2)]
        : [3000, 2000];
      addFurniture({ id: newId(), item: item.id, at, rotation: 0 });
      toast.success(`${item.name} added to the plan`);
    },
    [addFurniture],
  );

  const scrollCategories = (direction: "left" | "right") => {
    categoryScrollRef.current?.scrollBy({
      left: direction === "left" ? -120 : 120,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--foreground)]">
          Furniture
        </h2>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--muted-foreground)]"
            size={14}
          />
          <Input
            placeholder="Search furniture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 bg-[var(--secondary)] pl-8 text-xs placeholder:text-[var(--muted-foreground)]"
          />
        </div>
      </div>

      <div className="relative px-2 pb-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollCategories("left")}
            className="shrink-0 rounded p-0.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <ChevronLeft size={14} />
          </button>

          <div
            ref={categoryScrollRef}
            className="scrollbar-none flex flex-1 gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-all duration-150 active:scale-[0.98]",
                  activeCategory === cat.id
                    ? "bg-[#2c2c2e] text-[var(--primary-foreground)] shadow-sm"
                    : "bg-[var(--secondary)] text-[var(--muted-foreground)] hover:bg-[var(--secondary)]/80 hover:text-[var(--foreground)]",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollCategories("right")}
            className="shrink-0 rounded p-0.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <Separator className="bg-[var(--border)]" />

      <ScrollArea className="flex-1 px-3 py-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-2.5"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </motion.div>
          ) : filteredItems.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-2.5"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  layout
                >
                  <FurnitureCard item={item} onQuickAdd={handleQuickAdd} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-3 py-16 text-center"
            >
              <div className="rounded-full bg-[var(--secondary)] p-4">
                <PackageOpen size={28} className="text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">No furniture found</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  Try a different search or category
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};
