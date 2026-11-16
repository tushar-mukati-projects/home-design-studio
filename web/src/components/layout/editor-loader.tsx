"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { EditorView } from "@/features/editor/editor-view";
import { FullScreenLoader } from "./full-screen-loader";

const LazyEditorView = dynamic(
  () => import("@/features/editor/editor-view").then((mod) => ({ default: mod.EditorView })),
  { ssr: false, loading: () => <FullScreenLoader label="Opening the editor" /> },
);

type EditorLoaderProps = ComponentProps<typeof EditorView>;

export const EditorLoader = (props: EditorLoaderProps) => <LazyEditorView {...props} />;
