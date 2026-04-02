"use client";

import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import type { CollaboratorCursor } from "@/stores/collaboration-store";

interface ConnectionStatusProps {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: CollaboratorCursor[];
}

const getInitials = (name: string): string => {
  return name
    .split(/[-\s]/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
};

export const ConnectionStatus = ({
  isConnected,
  isSynced,
  collaborators,
}: ConnectionStatusProps) => {
  const statusLabel = isSynced ? "Connected" : isConnected ? "Syncing..." : "Offline";

  const dotColor = isSynced ? "bg-green-500" : isConnected ? "bg-yellow-500" : "bg-red-500";

  const dotGlow = isSynced ? "shadow-[0_0_6px_rgba(34,197,94,0.6)]" : "";

  const editorCount = collaborators.length + 1;

  return (
    <div className="flex items-center gap-2">
      {collaborators.length > 0 && (
        <div className="flex -space-x-2">
          {collaborators.slice(0, 5).map((c) => (
            <Tooltip key={c.id} content={c.name.split("-").join(" ")} side="bottom">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--card)] text-[10px] font-semibold text-white shadow-sm transition-transform hover:z-10 hover:scale-110"
                style={{ backgroundColor: c.color }}
              >
                {getInitials(c.name)}
              </div>
            </Tooltip>
          ))}
          {collaborators.length > 5 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--muted)] text-[10px] font-semibold text-[var(--muted-foreground)]">
              +{collaborators.length - 5}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 shadow-sm">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", dotColor, dotGlow)} />
        <span className="text-xs font-medium text-[var(--muted-foreground)]">{statusLabel}</span>
        <span className="text-xs text-[var(--muted-foreground)]/60">
          {editorCount === 1 ? "1 editor" : `${editorCount} editors`}
        </span>
      </div>
    </div>
  );
};
