"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/layout/auth-guard";

const EditorView = dynamic(
  () =>
    import("@/features/editor/editor-view").then((mod) => ({
      default: mod.EditorView,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-background flex h-screen items-center justify-center">
        <Loader2 className="text-primary size-8 animate-spin" />
      </div>
    ),
  },
);

interface EditorPageProps {
  params: Promise<{ id: string }>;
}

const EditorPage = ({ params }: EditorPageProps) => {
  const { id } = use(params);

  return (
    <AuthGuard>
      <EditorView designId={id} />
    </AuthGuard>
  );
};

export default EditorPage;
