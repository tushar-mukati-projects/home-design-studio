"use client";

import { LayoutGrid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SegmentedTabs, type SegmentedTab } from "@/components/ui/segmented-tabs";
import type { ViewMode } from "./design-grid";

type DashboardToolbarProps = {
  search: string;
  onSearchChange: (search: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

const VIEW_MODE_TABS: SegmentedTab<ViewMode>[] = [
  {
    value: "grid",
    label: (
      <>
        <LayoutGrid className="size-4" />
        <span className="sr-only">Grid view</span>
      </>
    ),
  },
  {
    value: "list",
    label: (
      <>
        <List className="size-4" />
        <span className="sr-only">List view</span>
      </>
    ),
  },
];

export const DashboardToolbar = ({
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
}: DashboardToolbarProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="relative w-full flex-1 sm:max-w-sm">
      <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search designs..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9"
      />
    </div>
    <SegmentedTabs
      tabs={VIEW_MODE_TABS}
      value={viewMode}
      onChange={onViewModeChange}
      className="items-center"
      tabClassName="p-1.5"
    />
  </div>
);
