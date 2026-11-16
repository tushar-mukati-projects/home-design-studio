"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Clock, RotateCcw, Trash2, Plus, X, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  useFetchVersions,
  useCreateVersion,
  useRestoreVersion,
  useDeleteVersion,
} from "@/hooks/designs/useVersions";
import { useEditorModal } from "../use-editor-modal";

type VersionHistoryPanelProps = {
  designId: string;
  onClose: () => void;
  onRestored: () => void;
};

export const VersionHistoryPanel = ({
  designId,
  onClose,
  onRestored,
}: VersionHistoryPanelProps) => {
  const [versionName, setVersionName] = useState("");
  const [versionToRestore, setVersionToRestore] = useState<string | null>(null);
  const { data: versions, isLoading, error } = useFetchVersions(designId);
  const createMutation = useCreateVersion(designId);
  const restoreMutation = useRestoreVersion(designId);
  const deleteMutation = useDeleteVersion(designId);

  useEditorModal(versionToRestore !== null);

  const handleCreate = () => {
    const name = versionName.trim();
    createMutation.mutate(name === "" ? undefined : name, {
      onSuccess: () => {
        toast.success("Version saved");
        setVersionName("");
      },
    });
  };

  const handleRestore = () => {
    if (versionToRestore === null) return;
    restoreMutation.mutate(versionToRestore, {
      onSuccess: () => {
        toast.success("Version restored");
        setVersionToRestore(null);
        onRestored();
      },
    });
  };

  const handleDelete = (versionId: string) => {
    deleteMutation.mutate(versionId, { onSuccess: () => toast.success("Version deleted") });
  };

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Versions</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-b border-border p-3">
        <div className="flex gap-2">
          <Input
            placeholder="Version name (optional)"
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
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
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground">{getApiErrorMessage(error)}</p>
          </div>
        )}

        {versions?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Clock className="h-8 w-8 text-muted-foreground opacity-40" />
            <p className="text-xs text-muted-foreground">No versions yet</p>
          </div>
        )}

        {versions?.map((version) => (
          <div
            key={version.id}
            className="group border-b border-border px-4 py-3 transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{version.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Restore this version"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => setVersionToRestore(version.id)}
                  disabled={restoreMutation.isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete this version"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
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

      <Dialog
        open={versionToRestore !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setVersionToRestore(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Restore this version?</DialogTitle>
            <DialogDescription>Your current plan will be replaced.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionToRestore(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoreMutation.isPending}>
              {restoreMutation.isPending ? "Restoring..." : "Restore"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
