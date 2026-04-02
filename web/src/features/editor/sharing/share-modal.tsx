"use client";

import { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Mail,
  Trash2,
  Globe,
  Lock,
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
  useDesignShares,
  useShareDesign,
  useRevokeShare,
  useToggleShareLink,
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
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useDesignShares(designId);
  const shareMutation = useShareDesign(designId);
  const revokeMutation = useRevokeShare(designId);
  const linkMutation = useToggleShareLink(designId);

  const shares = data?.shares ?? [];
  const shareToken = data?.shareToken ?? null;
  const shareLinkAccess = data?.shareLinkAccess ?? "readonly";

  const handleShare = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }
    try {
      await shareMutation.mutateAsync({ email: trimmed, permission });
      toast.success(`Invitation sent to ${trimmed}`);
      setEmail("");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg || "Failed to share");
    }
  };

  const handleCopyLink = () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLink = async (enabled: boolean) => {
    await linkMutation.mutateAsync({ enabled, access: shareLinkAccess });
    toast.success(enabled ? "Share link enabled" : "Share link disabled");
  };

  const handleLinkAccessChange = async (access: string) => {
    await linkMutation.mutateAsync({ enabled: true, access });
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
                onKeyDown={(e) => e.key === "Enter" && handleShare()}
                className="h-10 pl-9 text-sm"
              />
            </div>
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value as "readonly" | "readwrite")}
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-xs font-medium text-[var(--foreground)] outline-none focus:ring-1 focus:ring-[var(--ring)]"
            >
              <option value="readonly">Viewer</option>
              <option value="readwrite">Editor</option>
            </select>
            <Button
              className="h-10 gap-2 px-4"
              onClick={handleShare}
              disabled={shareMutation.isPending || !email.trim()}
            >
              {shareMutation.isPending ? (
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

            {isLoading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-[var(--muted-foreground)]" />
              </div>
            )}

            {shares.map((s) => (
              <div
                key={s.id}
                className="group flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--muted-foreground)]">
                  {s.permission === "readwrite" ? (
                    <Pencil className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {s.sharedWithEmail}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {s.permission === "readwrite" ? "Can edit" : "Can view"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-[var(--muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100 hover:text-[var(--destructive)]"
                  onClick={() => revokeMutation.mutate(s.id)}
                  disabled={revokeMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {!isLoading && shares.length === 0 && (
              <div className="py-6 text-center text-xs text-[var(--muted-foreground)]">
                No one else has access yet
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="px-6 py-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {shareToken ? (
                <Globe className="h-4 w-4 text-green-400" />
              ) : (
                <Lock className="h-4 w-4 text-[var(--muted-foreground)]" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {shareToken ? "Anyone with the link" : "Link sharing off"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {shareToken
                    ? `Can ${shareLinkAccess === "readwrite" ? "edit" : "view"} this design`
                    : "Only people you invite can access"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggleLink(!shareToken)}
              disabled={linkMutation.isPending}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                shareToken ? "bg-green-500" : "bg-[var(--muted)]"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  shareToken ? "translate-x-[22px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>

          {shareToken && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex flex-1 items-center overflow-hidden rounded-md border border-[var(--border)] bg-[var(--secondary)] px-3">
                  <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--muted-foreground)]" />
                  <span className="ml-2 truncate font-mono text-xs text-[var(--muted-foreground)]">
                    {typeof window !== "undefined" ? window.location.origin : ""}/shared/
                    {shareToken}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 shrink-0 gap-1.5"
                  onClick={handleCopyLink}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied!" : "Copy link"}
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">Anyone with link can</span>
                <select
                  value={shareLinkAccess}
                  onChange={(e) => handleLinkAccessChange(e.target.value)}
                  className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs font-medium text-[var(--foreground)] outline-none"
                >
                  <option value="readonly">View</option>
                  <option value="readwrite">Edit</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
