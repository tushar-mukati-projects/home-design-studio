"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PackageOpen, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useEditorStore } from "@/stores/editor-store";
import { useFetchFurniture } from "@/hooks/furniture/useFetchFurniture";
import { getApiErrorMessage } from "@/lib/api-error";
import { ROOM_USAGE_LABELS } from "@/lib/canvas";
import { FURNITURE_CATEGORIES, type CatalogItem, type FurnitureCategory } from "@/shared/canvas";
import { addToPlan, quickAddPosition } from "./add-to-plan";
import { FurnitureCard } from "./furniture-card";

const CATEGORY_SCROLL_PX = 120;
const SKELETON_CARDS = 6;

type CategoryFilter = FurnitureCategory | "all";

type CategoryTab = {
  id: CategoryFilter;
  label: string;
};

const CATEGORY_TABS: CategoryTab[] = [
  { id: "all", label: "All" },
  ...FURNITURE_CATEGORIES.map((id) => ({ id, label: ROOM_USAGE_LABELS[id] })),
];

const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export const FurnitureCatalog = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  const { data: catalog = [], isLoading, error } = useFetchFurniture();

  const filteredItems = useMemo(() => {
    let items = catalog;
    if (activeCategory !== "all") items = items.filter((item) => item.category === activeCategory);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      items = items.filter((item) => item.name.toLowerCase().includes(query));
    }
    return items;
  }, [catalog, activeCategory, search]);

  const handleQuickAdd = useCallback((item: CatalogItem) => {
    addToPlan(item, quickAddPosition(useEditorStore.getState()));
  }, []);

  const scrollCategories = (direction: "left" | "right") => {
    categoryScrollRef.current?.scrollBy({
      left: direction === "left" ? -CATEGORY_SCROLL_PX : CATEGORY_SCROLL_PX,
      behavior: "smooth",
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-heading text-lg font-semibold text-foreground">Furniture</h2>
      </div>

      <div className="px-4 pb-3">
        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
            size={14}
          />
          <Input
            placeholder="Search furniture..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 bg-secondary pl-8 text-xs placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="relative px-2 pb-2">
        <div className="flex items-center gap-1">
          <button
            aria-label="Scroll categories left"
            onClick={() => scrollCategories("left")}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
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
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground",
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <button
            aria-label="Scroll categories right"
            onClick={() => scrollCategories("right")}
            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <Separator className="bg-border" />

      <ScrollArea className="flex-1 px-3 py-3">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <motion.div key="loading" {...FADE} className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </motion.div>
          ) : error ? (
            <CatalogNotice key="error" icon={AlertCircle} title="Couldn't load furniture">
              {getApiErrorMessage(error)}
            </CatalogNotice>
          ) : filteredItems.length > 0 ? (
            <motion.div key="grid" {...FADE} className="grid grid-cols-2 gap-2.5">
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
            <CatalogNotice key="empty" icon={PackageOpen} title="No furniture found">
              Try a different search or category
            </CatalogNotice>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};

type CatalogNoticeProps = {
  icon: typeof PackageOpen;
  title: string;
  children: string;
};

const CatalogNotice = ({ icon: Icon, title, children }: CatalogNoticeProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-col items-center justify-center gap-3 py-16 text-center"
  >
    <div className="rounded-full bg-secondary p-4">
      <Icon size={28} className="text-muted-foreground" />
    </div>
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{children}</p>
    </div>
  </motion.div>
);
