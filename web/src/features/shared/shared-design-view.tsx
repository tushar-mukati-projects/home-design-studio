"use client";

import Link from "next/link";
import { EditorLoader } from "@/components/layout/editor-loader";
import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { useFetchDesign } from "@/hooks/designs/useFetchDesign";
import { getApiErrorMessage } from "@/lib/api-error";

type SharedDesignViewProps = {
  id: string;
  code: string;
};

const INVALID_LINK_MESSAGE = "This shared link is invalid or has been disabled.";

export const SharedDesignView = ({ id, code }: SharedDesignViewProps) => {
  const design = useFetchDesign(code ? id : "", code);

  if (design.isLoading) return <FullScreenLoader label="Opening the shared design" />;

  if (!design.data) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">
            {design.error ? getApiErrorMessage(design.error) : INVALID_LINK_MESSAGE}
          </p>
          <Link href="/" className="text-sm text-primary hover:underline">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <EditorLoader
      designId={design.data.id}
      preloadedDesign={design.data}
      permissionOverride="readonly"
    />
  );
};
