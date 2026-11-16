"use client";

import { Trash2, Eye, Pencil, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRemoveMember } from "@/hooks/designs/useSharing";
import { getApiErrorMessage } from "@/lib/api-error";
import type { DesignMember } from "@/types";

const SKELETON_ROWS = 2;

type AccessListProps = {
  designId: string;
  members: DesignMember[] | undefined;
  isLoading: boolean;
  error: Error | null;
};

type MemberRowProps = {
  member: DesignMember;
  removing: boolean;
  onRemove: (memberId: string) => void;
};

export const AccessList = ({ designId, members, isLoading, error }: AccessListProps) => {
  const removeMember = useRemoveMember(designId);
  return (
    <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Crown className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">You</p>
          <p className="text-xs text-muted-foreground">Owner</p>
        </div>
      </div>

      {isLoading &&
        Array.from({ length: SKELETON_ROWS }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
          >
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}

      {error && (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground">
          {getApiErrorMessage(error)}
        </div>
      )}

      {members?.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          removing={removeMember.isPending}
          onRemove={removeMember.mutate}
        />
      ))}

      {members?.length === 0 && (
        <div className="py-6 text-center text-xs text-muted-foreground">
          No one else has access yet
        </div>
      )}
    </div>
  );
};

const MemberRow = ({ member, removing, onRemove }: MemberRowProps) => {
  const canEdit = member.permission === "readwrite";
  return (
    <div className="group flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
        {canEdit ? <Pencil className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{member.email}</p>
        <p className="text-xs text-muted-foreground">{canEdit ? "Can edit" : "Can view"}</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${member.email}`}
        className="h-8 w-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
        onClick={() => onRemove(member.id)}
        disabled={removing}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
