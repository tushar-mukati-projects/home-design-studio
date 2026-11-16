"use client";

import { Suspense, useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { QueryError } from "@/components/ui/query-error";
import { UpgradeModal } from "@/features/billing/upgrade-modal";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import { useFetchDesigns } from "@/hooks/designs/useFetchDesigns";
import type { DesignListItem, DesignTemplate } from "@/types";
import { CheckoutResult } from "./checkout-result";
import { CreateDesignDialog } from "./create-design-dialog";
import { DashboardHeader } from "./dashboard-header";
import { DesignCardSkeleton, EmptyDesigns, EmptySearch } from "./dashboard-states";
import { DashboardToolbar } from "./dashboard-toolbar";
import { DeleteDesignDialog, RenameDesignDialog } from "./design-dialogs";
import { DesignGrid, gridClass, type ViewMode } from "./design-grid";
import { SharedWithMe } from "./shared-with-me";
import { TemplateGallery } from "./template-gallery";
import { useDashboardActions } from "./use-dashboard-actions";

const PAGE_SIZE = 50;
const SKELETON_COUNT = 6;
const SEARCH_DEBOUNCE_MS = 300;

const useDebouncedSearch = (search: string) => {
  const [debounced, setDebounced] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);
  return debounced;
};

export const DashboardView = () => {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DesignListItem | null>(null);
  const [toRename, setToRename] = useState<DesignListItem | null>(null);
  const [galleryCreating, setGalleryCreating] = useState(false);

  const debouncedSearch = useDebouncedSearch(search);
  const designs = useFetchDesigns({ search: debouncedSearch, limit: PAGE_SIZE, offset });
  const shared = useFetchDesigns({ scope: "shared" });
  const plan = useFetchPlan();
  const actions = useDashboardActions(plan);

  const changeSearch = (next: string) => {
    setSearch(next);
    setOffset(0);
  };

  const handleCreateClick = () => actions.guardCreate() && setCreateOpen(true);

  const handleUseTemplate = (template: DesignTemplate) => {
    if (galleryCreating || !actions.guardCreate()) return;
    setGalleryCreating(true);
    actions.create(
      { name: `${template.name} Design`, templateId: template.id },
      { onFailed: () => setGalleryCreating(false) },
    );
  };

  const handleDeleted = () => {
    setToDelete(null);
    if (designs.data?.designs.length === 1 && offset > 0)
      setOffset(Math.max(0, offset - PAGE_SIZE));
  };
  const hasDesigns = debouncedSearch !== "" || (designs.data?.total ?? 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <CheckoutResult />
      </Suspense>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <DashboardHeader
            total={designs.data?.total}
            sharedTotal={shared.data?.total}
            plan={plan.data}
            onCreate={handleCreateClick}
            onPlanClick={() => actions.setUpgradeOpen(true)}
          />

          {hasDesigns && (
            <DashboardToolbar
              search={search}
              onSearchChange={changeSearch}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          )}

          {designs.isError ? (
            <QueryError
              error={designs.error}
              onRetry={() => designs.refetch()}
              retrying={designs.isFetching}
            />
          ) : designs.data === undefined ? (
            <div className={gridClass(viewMode)}>
              {Array.from({ length: SKELETON_COUNT }, (_, i) => (
                <DesignCardSkeleton key={i} />
              ))}
            </div>
          ) : designs.data.total === 0 ? (
            debouncedSearch ? (
              <EmptySearch />
            ) : (
              <EmptyDesigns onCreateClick={handleCreateClick} />
            )
          ) : (
            <DesignGrid
              page={designs.data}
              viewMode={viewMode}
              onPageChange={setOffset}
              onOpen={(design) => actions.openDesign(design.id)}
              actions={{
                onDuplicate: actions.duplicate,
                onRename: setToRename,
                onDelete: setToDelete,
              }}
            />
          )}
        </div>

        <SharedWithMe query={shared} onOpen={(design) => actions.openDesign(design.id)} />

        <div className="mt-10">
          <TemplateGallery creating={galleryCreating} onUse={handleUseTemplate} />
        </div>
      </main>

      <CreateDesignDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(payload) => actions.create(payload, { onCreated: () => setCreateOpen(false) })}
        creating={actions.creating}
      />
      <DeleteDesignDialog
        design={toDelete}
        pending={actions.deleting}
        onConfirm={(design) => actions.remove(design, handleDeleted)}
        onClose={() => setToDelete(null)}
      />
      <RenameDesignDialog
        design={toRename}
        pending={actions.renaming}
        onConfirm={(design, name) => actions.rename(design, name, () => setToRename(null))}
        onClose={() => setToRename(null)}
      />
      <UpgradeModal open={actions.upgradeOpen} onClose={() => actions.setUpgradeOpen(false)} />
    </div>
  );
};
