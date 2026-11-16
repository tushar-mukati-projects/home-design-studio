"use client";

import { LayoutTemplate } from "lucide-react";
import type { DesignTemplate } from "@/types";
import { TemplatePicker } from "./template-picker";

type TemplateGalleryProps = {
  onUse: (template: DesignTemplate) => void;
  creating: boolean;
};

export const TemplateGallery = ({ onUse, creating }: TemplateGalleryProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-2">
      <LayoutTemplate className="size-5 text-primary" />
      <h2 className="font-heading text-xl text-foreground">Start from a Template</h2>
    </div>

    <TemplatePicker selectedId={null} onPick={onUse} columns="four" />

    {creating && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-foreground">Creating design...</p>
        </div>
      </div>
    )}
  </div>
);
