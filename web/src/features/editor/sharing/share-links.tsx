"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, Copy, Check, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCreateLink, useRevokeLink } from "@/hooks/designs/useSharing";
import { getApiErrorMessage } from "@/lib/api-error";
import { COPY_FEEDBACK_MS } from "@/lib/constants";
import type { DesignLink } from "@/types";

type ShareLinksProps = {
  designId: string;
  links: DesignLink[];
};

export const ShareLinks = ({ designId, links }: ShareLinksProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createLink = useCreateLink(designId);
  const revokeLink = useRevokeLink(designId);

  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    [],
  );

  const handleCreateLink = () => {
    createLink.mutate(
      { permission: "readonly" },
      { onSuccess: () => toast.success("Share link created") },
    );
  };

  const handleCopy = async (link: DesignLink) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/shared/${designId}?code=${link.code}`,
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Couldn't copy the link"));
      return;
    }
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    setCopiedId(link.id);
    toast.success("Link copied");
    copiedTimer.current = setTimeout(() => setCopiedId(null), COPY_FEEDBACK_MS);
  };

  return (
    <div className="px-6 py-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Share links</p>
          <p className="text-xs text-muted-foreground">Anyone with a link can view this design</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1.5"
          onClick={handleCreateLink}
          disabled={createLink.isPending}
        >
          {createLink.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Link2 className="h-3.5 w-3.5" />
          )}
          New link
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="py-3 text-center text-xs text-muted-foreground">No share links yet</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className="flex gap-2">
              <div className="flex flex-1 items-center overflow-hidden rounded-md border border-border bg-secondary px-3">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="ml-2 truncate font-mono text-xs text-muted-foreground">
                  /shared/{designId}?code={link.code}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-1.5"
                onClick={() => handleCopy(link)}
              >
                {copiedId === link.id ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copiedId === link.id ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Revoke this link"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => revokeLink.mutate(link.id)}
                disabled={revokeLink.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
