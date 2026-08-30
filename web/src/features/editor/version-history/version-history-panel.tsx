"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, RotateCcw, Trash2, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useFetchVersions,
  useCreateVersion,
  useRestoreVersion,
  useDeleteVersion,
} from "@/hooks/designs/useVersions";

interface VersionHistoryPanelProps {
  designId: string;
  onClose: () => void;
  onRestored: () => void;
}

export const VersionHistoryPanel = ({
  designId,
  onClose,
  onRestored,
}: VersionHistoryPanelProps) => {
  const [versionName, setVersionName] = useState("");
  const { data: versions, isLoading } = useFetchVersions(designId);
  const createMutation = useCreateVersion(designId);
  const restoreMutation = useRestoreVersion(designId);
  const deleteMutation = useDeleteVersion(designId);

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(versionName.trim() || undefined);
      toast.success("Version saved");
      setVersionName("");
    } catch {}
  };

  const handleRestore = async (versionId: string) => {
    try {
      await restoreMutation.mutateAsync(versionId);
      toast.success("Version restored");
      onRestored();
    } catch {}
  };

  const handleDelete = async (versionId: string) => {
    try {
      await deleteMutation.mutateAsync(versionId);
      toast.success("Version deleted");
    } catch {}
  };

  return (
    <div className="flex h-full w-[300px] flex-col border-l border-[var(--border)] bg-[var(--card)]">
      <div className="flex h-12 items-center justify-between border-b border-[var(--border)] px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--muted-foreground)]" />
          <span className="text-sm font-semibold text-[var(--foreground)]">Version History</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-[var(--border)] p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Version name (optional)"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1 px-3"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Save</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted-foreground)]" />
          </div>
        )}

        {!isLoading && (!versions || versions.length === 0) && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Clock className="h-8 w-8 text-[var(--muted-foreground)] opacity-40" />
            <p className="text-xs text-[var(--muted-foreground)]">No versions yet</p>
          </div>
        )}

        {versions?.map((version) => (
          <div
            key={version.id}
            className="group border-b border-[var(--border)] px-4 py-3 transition-colors hover:bg-[var(--secondary)]/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">
                  {version.name}
                </p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                  {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                  onClick={() => handleRestore(version.id)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
                  onClick={() => handleDelete(version.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
