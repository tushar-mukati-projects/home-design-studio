"use client";

import { useState } from "react";
import { Mail, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useDesignAccess, useAddMember } from "@/hooks/designs/useSharing";
import type { SharePermission } from "@/shared/canvas";
import { AccessList } from "./access-list";
import { ShareLinks } from "./share-links";
import { useEditorModal } from "../use-editor-modal";

type ShareModalProps = {
  open: boolean;
  onClose: () => void;
  designId: string;
  designName: string;
};

export const ShareModal = ({ open, onClose, designId, designName }: ShareModalProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<SharePermission>("readonly");
  const access = useDesignAccess(designId);
  const addMember = useAddMember(designId);

  useEditorModal(open);

  const handleInvite = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    addMember.mutate(
      { email: trimmed, permission },
      {
        onSuccess: () => {
          toast.success(`Invitation sent to ${trimmed}`);
          setEmail("");
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Share &ldquo;{designName}&rdquo;
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Add people by email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleInvite();
                }}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as SharePermission)}
              className="h-10 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="readonly">Can view</option>
              <option value="readwrite">Can edit</option>
            </select>
            <Button
              className="h-10 gap-2 px-4"
              onClick={handleInvite}
              disabled={addMember.isPending}
            >
              {addMember.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Invite
            </Button>
          </div>
        </div>

        <div className="px-6 pb-4">
          <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            People with access
          </p>
          <AccessList
            designId={designId}
            members={access.data?.members}
            isLoading={access.isLoading}
            error={access.error}
          />
        </div>

        <Separator />

        <ShareLinks designId={designId} links={access.data?.links ?? []} />
      </DialogContent>
    </Dialog>
  );
};
