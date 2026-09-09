"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Mail,
  Trash2,
  UserPlus,
  Eye,
  Pencil,
  Crown,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  useDesignAccess,
  useAddMember,
  useRemoveMember,
  useCreateLink,
  useRevokeLink,
} from "@/hooks/designs/useSharing";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  designId: string;
  designName: string;
}

export const ShareModal = ({ open, onClose, designId, designName }: ShareModalProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"readonly" | "readwrite">("readonly");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading } = useDesignAccess(designId);
  const addMember = useAddMember(designId);
  const removeMember = useRemoveMember(designId);
  const createLink = useCreateLink(designId);
  const revokeLink = useRevokeLink(designId);

  const members = data?.members ?? [];
  const links = data?.links ?? [];

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await addMember.mutateAsync({ email: trimmed, permission });
      toast.success(`Invitation sent to ${trimmed}`);
      setEmail("");
    } catch {}
  };

  const handleCreateLink = async () => {
    try {
      await createLink.mutateAsync({ permission: "readonly" });
      toast.success("Share link created");
    } catch {}
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/shared/${designId}?code=${code}`);
    setCopiedId(id);
    toast.success("Link copied");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Share &ldquo;{designName}&rdquo;
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5 flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" />
              <Input
                placeholder="Add people by email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "readonly" | "readwrite")}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-medium text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="readonly">Can view</option>
              <option value="readwrite">Can edit</option>
            </select>
            <Button
              className="h-10 gap-2 px-4"
              onClick={handleInvite}
              disabled={addMember.isPending || !email.trim()}
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
          <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--muted-foreground)] uppercase">
            People with access
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--border)]">
            <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]">
                <Crown className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--foreground)]">You</p>
                <p className="text-xs text-[var(--muted-foreground)]">Owner</p>
              </div>
            </div>

            {members.map((m) => (
              <div
                key={m.id}
                className="group flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)]">
                  {m.permission === "readwrite" ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--foreground)]">{m.email}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {m.permission === "readwrite" ? "Can edit" : "Can view"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--destructive)]"
                  onClick={() => removeMember.mutate(m.id)}
                  disabled={removeMember.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {!isLoading && members.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                No one else has access yet
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Share links</p>
              <p className="text-xs text-[var(--muted-foreground)]">
                Anyone with a link can view this design
              </p>
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
            <p className="py-3 text-center text-xs text-[var(--muted-foreground)]">
              No share links yet
            </p>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex gap-2">
                  <div className="flex flex-1 items-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3">
                    <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                    <span className="ml-2 truncate font-mono text-xs text-[var(--muted-foreground)]">
                      /shared/{designId}?code={link.code}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5"
                    onClick={() => handleCopy(link.code, link.id)}
                  >
                    {copiedId === link.id ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedId === link.id ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-[var(--muted-foreground)] hover:text-[var(--destructive)]"
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
      </DialogContent>
    </Dialog>
  );
};
