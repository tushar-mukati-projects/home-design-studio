"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  ExternalLink,
  Copy,
  Pencil,
  Trash2,
  FileQuestion,
  DoorOpen,
  Armchair,
  Ruler,
  Users,
  Layers,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import NProgress from "nprogress";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useFetchDesigns, useCreateDesign, useDeleteDesign } from "@/hooks/designs";
import { useSharedWithMe } from "@/hooks/designs/useSharing";
import { useFetchTemplates, useCreateFromTemplate } from "@/hooks/templates";
import { useFetchPlan } from "@/hooks/billing";
import { useQueryClient } from "@tanstack/react-query";
import { BILLING_QUERY_KEYS } from "@/hooks/billing/constants";
import { UpgradeModal } from "@/features/billing/upgrade-modal";
import { PlanBadge } from "@/features/billing/plan-badge";
import { cn } from "@/lib/utils";
import type { DesignTemplate, DesignSummary } from "@/types";
import { TemplateGallery } from "./template-gallery";

const DIMENSION_PRESETS = [
  { label: "Studio Apartment (8×6m)", width: 800, height: 600 },
  { label: "One Bedroom (10×8m)", width: 1000, height: 800 },
  { label: "Two Bedroom (14×10m)", width: 1400, height: 1000 },
  { label: "Custom", width: 0, height: 0 },
] as const;

interface DesignThumbnailProps {
  design: DesignSummary;
}

const DesignThumbnail = ({ design }: DesignThumbnailProps) => {
  const { width, height, rooms } = design;
  const aspectRatio = width / height;
  const svgWidth = 400;
  const svgHeight = svgWidth / aspectRatio;
  const scaleX = svgWidth / width;
  const scaleY = svgHeight / height;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={0} y={0} width={svgWidth} height={svgHeight} fill="var(--secondary)" rx={4} />
      {rooms.length > 0 ? (
        rooms.map((room) => {
          const minX = Math.min(...room.points.map((p) => p.x));
          const minY = Math.min(...room.points.map((p) => p.y));
          const maxX = Math.max(...room.points.map((p) => p.x));
          const maxY = Math.max(...room.points.map((p) => p.y));
          return (
            <rect
              key={room.id}
              x={minX * scaleX + 2}
              y={minY * scaleY + 2}
              width={(maxX - minX) * scaleX - 4}
              height={(maxY - minY) * scaleY - 4}
              fill={room.color}
              opacity={0.25}
              rx={3}
              stroke={room.color}
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
          );
        })
      ) : (
        <>
          <line
            x1={svgWidth * 0.2}
            y1={svgHeight * 0.2}
            x2={svgWidth * 0.8}
            y2={svgHeight * 0.2}
            stroke="var(--border)"
            strokeWidth={2}
          />
          <line
            x1={svgWidth * 0.8}
            y1={svgHeight * 0.2}
            x2={svgWidth * 0.8}
            y2={svgHeight * 0.8}
            stroke="var(--border)"
            strokeWidth={2}
          />
          <line
            x1={svgWidth * 0.8}
            y1={svgHeight * 0.8}
            x2={svgWidth * 0.2}
            y2={svgHeight * 0.8}
            stroke="var(--border)"
            strokeWidth={2}
          />
          <line
            x1={svgWidth * 0.2}
            y1={svgHeight * 0.8}
            x2={svgWidth * 0.2}
            y2={svgHeight * 0.2}
            stroke="var(--border)"
            strokeWidth={2}
          />
          <line
            x1={svgWidth * 0.5}
            y1={svgHeight * 0.2}
            x2={svgWidth * 0.5}
            y2={svgHeight * 0.8}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <line
            x1={svgWidth * 0.2}
            y1={svgHeight * 0.5}
            x2={svgWidth * 0.8}
            y2={svgHeight * 0.5}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </>
      )}
    </svg>
  );
};

const DesignCardSkeleton = () => {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-1/2" />
      </CardContent>
    </Card>
  );
};

interface EmptyStateProps {
  onCreateClick: () => void;
}

const EmptyState = ({ onCreateClick }: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center px-4 py-24 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]">
        <FileQuestion className="h-10 w-10 text-[var(--muted-foreground)]" />
      </div>
      <h3
        className="mb-2 text-2xl text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        No designs yet
      </h3>
      <p className="mb-8 max-w-md text-[var(--muted-foreground)]">
        Create your first floor plan to get started. Design rooms, place furniture, and bring your
        vision to life.
      </p>
      <Button onClick={onCreateClick}>
        <Plus className="h-4 w-4" />
        Create Your First Design
      </Button>
    </motion.div>
  );
};

const SearchEmptyState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center px-4 py-24 text-center"
    >
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--secondary)]">
        <Search className="h-10 w-10 text-[var(--muted-foreground)]" />
      </div>
      <h3
        className="mb-2 text-2xl text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        No matching designs
      </h3>
      <p className="max-w-md text-[var(--muted-foreground)]">
        Try adjusting your search term to find what you are looking for.
      </p>
    </motion.div>
  );
};

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

export const DashboardView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: fetchedDesigns, isLoading } = useFetchDesigns();
  const { data: sharedDesigns } = useSharedWithMe();
  const createDesign = useCreateDesign();
  const deleteDesign = useDeleteDesign();
  const { data: templates } = useFetchTemplates();
  const createFromTemplate = useCreateFromTemplate();
  const { data: planData } = useFetchPlan();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const checkoutStatus = searchParams.get("checkout");
    if (checkoutStatus === "success") {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.plan });
      toast.success("Payment successful! Your plan has been upgraded.");
      router.replace("/dashboard", { scroll: false });
    } else if (checkoutStatus === "cancelled") {
      toast.info("Checkout was cancelled.");
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  const [searchQuery, setSearchQuery] = useState("");
  const [createTab, setCreateTab] = useState<"blank" | "template">("blank");
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [designToDelete, setDesignToDelete] = useState<DesignSummary | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [, setDesignToRename] = useState<DesignSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [newDesignName, setNewDesignName] = useState("");
  const [newDesignDescription, setNewDesignDescription] = useState("");
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [customWidth, setCustomWidth] = useState(800);
  const [customHeight, setCustomHeight] = useState(600);

  const designs = useMemo(() => fetchedDesigns ?? [], [fetchedDesigns]);

  const filteredDesigns = useMemo(() => {
    if (!searchQuery.trim()) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter(
      (d) => d.name.toLowerCase().includes(query) || d.description?.toLowerCase().includes(query),
    );
  }, [designs, searchQuery]);

  const resetCreateForm = () => {
    setNewDesignName("");
    setNewDesignDescription("");
    setSelectedPreset(0);
    setCustomWidth(800);
    setCustomHeight(600);
    setCreateTab("blank");
    setSelectedTemplate(null);
  };

  const handleCreateDesign = async () => {
    if (!newDesignName.trim()) {
      toast.error("Please enter a design name");
      return;
    }

    const isCustom = selectedPreset === 3;
    const width = isCustom ? customWidth : DIMENSION_PRESETS[selectedPreset].width;
    const height = isCustom ? customHeight : DIMENSION_PRESETS[selectedPreset].height;

    if (isCustom && (customWidth < 200 || customHeight < 200)) {
      toast.error("Minimum dimensions are 200 × 200");
      return;
    }

    try {
      const design = await createDesign.mutateAsync({
        name: newDesignName.trim(),
        description: newDesignDescription.trim() || undefined,
        width,
        height,
      });
      toast.success("Design created successfully");
      setCreateDialogOpen(false);
      resetCreateForm();
      NProgress.start();
      router.push(`/editor/${design.id}`);
    } catch {}
  };

  const handleCreateFromSelectedTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (!newDesignName.trim()) {
      toast.error("Please enter a design name");
      return;
    }
    try {
      const design = await createFromTemplate.mutateAsync({
        templateId: selectedTemplate.id,
        name: newDesignName.trim(),
      });
      toast.success("Design created from template");
      setCreateDialogOpen(false);
      resetCreateForm();
      NProgress.start();
      router.push(`/editor/${design.id}`);
    } catch {}
  };

  const handleDeleteDesign = async () => {
    if (!designToDelete) return;

    try {
      await deleteDesign.mutateAsync(designToDelete.id);
      toast.success(`"${designToDelete.name}" has been deleted`);
      setDeleteDialogOpen(false);
      setDesignToDelete(null);
    } catch {}
  };

  const handleDuplicateDesign = async (design: DesignSummary) => {
    try {
      const duplicated = await createDesign.mutateAsync({
        name: `${design.name} (Copy)`,
        description: design.description ?? undefined,
        width: design.width,
        height: design.height,
      });
      toast.success(`Duplicated as "${duplicated.name}"`);
    } catch {}
  };

  const openDeleteDialog = (design: DesignSummary) => {
    setDesignToDelete(design);
    setDeleteDialogOpen(true);
  };

  const openRenameDialog = (design: DesignSummary) => {
    setDesignToRename(design);
    setRenameValue(design.name);
    setRenameDialogOpen(true);
  };

  const hasDesigns = designs.length > 0;

  const handleCreateClick = () => {
    if (
      planData &&
      planData.designLimit !== null &&
      isFinite(planData.designLimit) &&
      designs.length >= planData.designLimit
    ) {
      setUpgradeModalOpen(true);
      return;
    }
    setCreateDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                My Designs
              </h1>
              <PlanBadge onClick={() => setUpgradeModalOpen(true)} />
            </div>
            <Button onClick={handleCreateClick} className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Create New Design
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <Layers className="h-4 w-4 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-lg leading-tight font-semibold text-[var(--foreground)]">
                  {designs.length}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Total Designs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <Crown className="h-4 w-4 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-lg leading-tight font-semibold text-[var(--foreground)]">
                  {planData?.plan === "pro"
                    ? "∞"
                    : `${designs.length}/${planData?.designLimit ?? 3}`}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Plan Usage</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <Users className="h-4 w-4 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-lg leading-tight font-semibold text-[var(--foreground)]">
                  {sharedDesigns?.length ?? 0}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Shared with Me</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--secondary)]">
                <Ruler className="h-4 w-4 text-[var(--muted-foreground)]" />
              </div>
              <div>
                <p className="text-lg leading-tight font-semibold text-[var(--foreground)]">
                  {planData?.plan === "pro" ? "Pro" : "Free"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">Current Plan</p>
              </div>
            </div>
          </div>

          {hasDesigns && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full flex-1 sm:max-w-sm">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <Input
                  placeholder="Search designs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1 rounded-md border border-[var(--border)] p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "rounded-sm p-1.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-[var(--secondary)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "rounded-sm p-1.5 transition-colors",
                    viewMode === "list"
                      ? "bg-[var(--secondary)] text-[var(--foreground)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div
              className={cn(
                "grid gap-5",
                viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
              )}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <DesignCardSkeleton key={i} />
              ))}
            </div>
          ) : !hasDesigns ? (
            <EmptyState onCreateClick={handleCreateClick} />
          ) : filteredDesigns.length === 0 ? (
            <SearchEmptyState />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "grid gap-5",
                  viewMode === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1",
                )}
              >
                {filteredDesigns.map((design, index) => (
                  <motion.div
                    key={design.id}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {viewMode === "grid" ? (
                      <GridCard
                        design={design}
                        onOpen={() => {
                          NProgress.start();
                          router.push(`/editor/${design.id}`);
                        }}
                        onDuplicate={() => handleDuplicateDesign(design)}
                        onRename={() => openRenameDialog(design)}
                        onDelete={() => openDeleteDialog(design)}
                      />
                    ) : (
                      <ListCard
                        design={design}
                        onOpen={() => {
                          NProgress.start();
                          router.push(`/editor/${design.id}`);
                        }}
                        onDuplicate={() => handleDuplicateDesign(design)}
                        onRename={() => openRenameDialog(design)}
                        onDelete={() => openDeleteDialog(design)}
                      />
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {sharedDesigns && sharedDesigns.length > 0 && (
          <div className="mt-10">
            <h2
              className="mb-4 flex items-center gap-2 text-xl text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <Users className="h-5 w-5 text-[var(--primary)]" />
              Shared with me
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {sharedDesigns.map((item) => (
                <Card
                  key={item.id}
                  className="cursor-pointer overflow-hidden"
                  onClick={() => {
                    NProgress.start();
                    router.push(`/editor/${item.id}`);
                  }}
                >
                  <div className="h-32 overflow-hidden bg-[var(--secondary)]">
                    <DesignThumbnail design={item} />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="truncate font-semibold text-[var(--foreground)]">{item.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs font-normal">
                        {item.ownerName || item.ownerEmail}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {item.permission === "readwrite" ? "Can edit" : "View only"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <TemplateGallery
            onPlanLimitReached={() => setUpgradeModalOpen(true)}
            designCount={designs.length}
            designLimit={planData?.designLimit ?? null}
          />
        </div>
      </main>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>
              Create New Design
            </DialogTitle>
            <DialogDescription>Start from a blank canvas or choose a template.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-1 rounded-md border border-[var(--border)] p-1">
            <button
              type="button"
              onClick={() => setCreateTab("blank")}
              className={cn(
                "flex-1 rounded-sm px-3 py-1.5 text-sm transition-colors",
                createTab === "blank"
                  ? "bg-[var(--secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              Blank Canvas
            </button>
            <button
              type="button"
              onClick={() => setCreateTab("template")}
              className={cn(
                "flex-1 rounded-sm px-3 py-1.5 text-sm transition-colors",
                createTab === "template"
                  ? "bg-[var(--secondary)] text-[var(--foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
              )}
            >
              From Template
            </button>
          </div>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)]">Name</label>
              <Input
                placeholder="e.g. My Dream Apartment"
                value={newDesignName}
                onChange={(e) => setNewDesignName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (createTab === "blank") handleCreateDesign();
                    else handleCreateFromSelectedTemplate();
                  }
                }}
              />
            </div>
            {createTab === "blank" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">
                    Description
                  </label>
                  <textarea
                    placeholder="Optional description..."
                    value={newDesignDescription}
                    onChange={(e) => setNewDesignDescription(e.target.value)}
                    rows={2}
                    className="flex w-full resize-none rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)] focus-visible:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--foreground)]">Dimensions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {DIMENSION_PRESETS.map((preset, idx) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setSelectedPreset(idx)}
                        className={cn(
                          "rounded-md border px-3 py-2.5 text-left text-sm transition-all",
                          selectedPreset === idx
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]"
                            : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/50 hover:text-[var(--foreground)]",
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                {selectedPreset === 3 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3"
                  >
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-medium text-[var(--muted-foreground)]">
                        Width (cm)
                      </label>
                      <Input
                        type="number"
                        min={200}
                        max={5000}
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="text-xs font-medium text-[var(--muted-foreground)]">
                        Height (cm)
                      </label>
                      <Input
                        type="number"
                        min={200}
                        max={5000}
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                      />
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)]">Template</label>
                <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto">
                  {templates?.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t)}
                      className={cn(
                        "rounded-md border p-2 text-left transition-all",
                        selectedTemplate?.id === t.id
                          ? "border-[var(--primary)] bg-[var(--primary)]/10"
                          : "border-[var(--border)] hover:border-[var(--primary)]/50",
                      )}
                    >
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {t.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)] capitalize">
                        {t.category} &middot; {t.width}&times;{t.height}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false);
                resetCreateForm();
              }}
            >
              Cancel
            </Button>
            {createTab === "blank" ? (
              <Button onClick={handleCreateDesign} disabled={createDesign.isPending}>
                {createDesign.isPending ? "Creating..." : "Create Design"}
              </Button>
            ) : (
              <Button
                onClick={handleCreateFromSelectedTemplate}
                disabled={createFromTemplate.isPending || !selectedTemplate}
              >
                {createFromTemplate.isPending ? "Creating..." : "Use Template"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>Delete Design</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[var(--foreground)]">{designToDelete?.name}</span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDesignToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDesign}
              disabled={deleteDesign.isPending}
            >
              {deleteDesign.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "var(--font-heading)" }}>Rename Design</DialogTitle>
            <DialogDescription>Enter a new name for this design.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Design name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  toast.success(`Renamed to "${renameValue}"`);
                  setRenameDialogOpen(false);
                  setDesignToRename(null);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setDesignToRename(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (renameValue.trim()) {
                  toast.success(`Renamed to "${renameValue}"`);
                  setRenameDialogOpen(false);
                  setDesignToRename(null);
                }
              }}
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeModal open={upgradeModalOpen} onClose={() => setUpgradeModalOpen(false)} />
    </div>
  );
};

interface DesignCardProps {
  design: DesignSummary;
  onOpen: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const GridCard = ({ design, onOpen, onDuplicate, onRename, onDelete }: DesignCardProps) => {
  return (
    <div className="group relative">
      <Card className="cursor-pointer overflow-hidden" onClick={onOpen}>
        <div className="h-40 overflow-hidden bg-[var(--secondary)]">
          <DesignThumbnail design={design} />
        </div>
        <CardContent className="p-4">
          <h3 className="truncate font-semibold text-[var(--foreground)]">{design.name}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Ruler className="h-3 w-3" />
              {design.width} × {design.height}
            </Badge>
            {design.rooms.length > 0 && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <DoorOpen className="h-3 w-3" />
                {design.rooms.length} {design.rooms.length === 1 ? "room" : "rooms"}
              </Badge>
            )}
            {design.furniture.length > 0 && (
              <Badge variant="secondary" className="gap-1 font-normal">
                <Armchair className="h-3 w-3" />
                {design.furniture.length}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Updated {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
          </p>
        </CardContent>
      </Card>
      <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-[var(--destructive)]">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

const ListCard = ({ design, onOpen, onDuplicate, onRename, onDelete }: DesignCardProps) => {
  return (
    <div className="group relative">
      <Card className="cursor-pointer overflow-hidden" onClick={onOpen}>
        <div className="flex items-center gap-4 p-4">
          <div className="h-20 w-32 flex-shrink-0 overflow-hidden rounded-md bg-[var(--secondary)]">
            <DesignThumbnail design={design} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-[var(--foreground)]">{design.name}</h3>
            {design.description && (
              <p className="mt-0.5 truncate text-sm text-[var(--muted-foreground)]">
                {design.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1 font-normal">
                <Ruler className="h-3 w-3" />
                {design.width} × {design.height}
              </Badge>
              {design.rooms.length > 0 && (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <DoorOpen className="h-3 w-3" />
                  {design.rooms.length} {design.rooms.length === 1 ? "room" : "rooms"}
                </Badge>
              )}
              {design.furniture.length > 0 && (
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Armchair className="h-3 w-3" />
                  {design.furniture.length}
                </Badge>
              )}
              <span className="text-xs text-[var(--muted-foreground)]">
                Updated {formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </Card>
      <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onOpen}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onDelete} className="text-[var(--destructive)]">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
