"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFetchSharedDesign } from "@/hooks/designs/useFetchSharedDesign";
import { EditorView } from "@/features/editor/editor-view";

const SharedDesignPage = () => {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: design, isLoading, error } = useFetchSharedDesign(token ?? "");

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="space-y-4 text-center">
          <p className="text-[var(--muted-foreground)]">
            This shared link is invalid or has been disabled.
          </p>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <EditorView designId={design.id} preloadedDesign={design} permissionOverride="readonly" />;
};

export default SharedDesignPage;
