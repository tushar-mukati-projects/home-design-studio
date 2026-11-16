"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SegmentedTabs, type SegmentedTab } from "@/components/ui/segmented-tabs";
import type { CreateDesignPayload } from "@/hooks/designs/useCreateDesign";
import { DESIGN_NAME_MAX_CHARS } from "@/shared/canvas";
import type { DesignTemplate } from "@/types";
import { TemplatePicker } from "./template-picker";

type CreateTab = "blank" | "template";

type CreateDesignDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateDesignPayload) => void;
  creating: boolean;
};

const CREATE_TABS: SegmentedTab<CreateTab>[] = [
  { value: "blank", label: "Blank Plan" },
  { value: "template", label: "From Template" },
];

const LABEL_CLASS = "text-sm font-medium text-foreground";

export const CreateDesignDialog = ({
  open,
  onClose,
  onCreate,
  creating,
}: CreateDesignDialogProps) => {
  const [tab, setTab] = useState<CreateTab>("blank");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<DesignTemplate | null>(null);

  const reset = () => {
    setTab("blank");
    setName("");
    setDescription("");
    setTemplate(null);
  };

  const submit = () => {
    if (creating) return;
    if (!name.trim()) return toast.error("Please enter a design name");
    if (tab === "template" && !template) return toast.error("Please select a template");
    onCreate(
      tab === "template" && template
        ? { name: name.trim(), templateId: template.id }
        : { name: name.trim(), description: description.trim() || undefined },
    );
  };

  const close = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Create New Design</DialogTitle>
          <DialogDescription>Start from a blank plan or choose a template.</DialogDescription>
        </DialogHeader>
        <SegmentedTabs tabs={CREATE_TABS} value={tab} onChange={setTab} tabClassName="flex-1" />
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="new-design-name" className={LABEL_CLASS}>
              Name
            </label>
            <Input
              id="new-design-name"
              placeholder="e.g. My Dream Apartment"
              maxLength={DESIGN_NAME_MAX_CHARS}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {tab === "blank" ? (
            <div className="space-y-2">
              <label htmlFor="new-design-description" className={LABEL_CLASS}>
                Description
              </label>
              <textarea
                id="new-design-description"
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background focus-visible:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <span className={LABEL_CLASS}>Template</span>
              <div className="max-h-80 overflow-y-auto pr-1">
                <TemplatePicker
                  selectedId={template?.id ?? null}
                  onPick={setTemplate}
                  columns="two"
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={creating}>
            {creating ? "Creating..." : tab === "blank" ? "Create Design" : "Use Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
