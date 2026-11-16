"use client";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Collaborator } from "@/stores/collaboration-store";

const AVATAR_LIMIT = 5;
const INITIALS_MAX_CHARS = 2;

type Connection = "synced" | "syncing" | "offline";

const CONNECTION_LABEL = {
  synced: "Connected",
  syncing: "Syncing...",
  offline: "Offline",
} satisfies Record<Connection, string>;

const CONNECTION_DOT = {
  synced: "bg-success",
  syncing: "bg-warning",
  offline: "bg-destructive",
} satisfies Record<Connection, string>;

type ConnectionStatusProps = {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: Collaborator[];
};

export const ConnectionStatus = ({
  isConnected,
  isSynced,
  collaborators,
}: ConnectionStatusProps) => {
  const connection: Connection = isSynced ? "synced" : isConnected ? "syncing" : "offline";
  const memberCount = collaborators.length + 1;
  const hiddenCount = collaborators.length - AVATAR_LIMIT;

  return (
    <div className="flex items-center gap-2">
      {collaborators.length > 0 && (
        <div className="flex -space-x-2">
          {collaborators.slice(0, AVATAR_LIMIT).map((collaborator) => (
            <Tooltip key={collaborator.id} content={collaborator.name} side="bottom">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card text-2xs font-semibold text-primary-foreground shadow-sm transition-transform hover:z-10 hover:scale-110"
                style={{ backgroundColor: collaborator.color }}
              >
                {initials(collaborator.name)}
              </div>
            </Tooltip>
          ))}
          {hiddenCount > 0 && (
            <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-muted text-2xs font-semibold text-muted-foreground">
              +{hiddenCount}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 shadow-sm">
        <span className={cn("h-2 w-2 shrink-0 rounded-full", CONNECTION_DOT[connection])} />
        <span className="text-xs font-medium text-muted-foreground">
          {CONNECTION_LABEL[connection]}
        </span>
        <span className="text-xs text-muted-foreground/60">
          {memberCount === 1 ? "1 editor" : `${memberCount} editors`}
        </span>
      </div>
    </div>
  );
};

const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, INITIALS_MAX_CHARS);
