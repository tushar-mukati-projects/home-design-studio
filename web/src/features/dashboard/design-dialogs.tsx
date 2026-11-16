"use client";

import { useState } from "react";
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
import { DESIGN_NAME_MAX_CHARS } from "@/shared/canvas";
import type { DesignListItem } from "@/types";

type DeleteDesignDialogProps = {
  design: DesignListItem | null;
  pending: boolean;
  onConfirm: (design: DesignListItem) => void;
  onClose: () => void;
};

type RenameDesignDialogProps = {
  design: DesignListItem | null;
  pending: boolean;
  onConfirm: (design: DesignListItem, name: string) => void;
  onClose: () => void;
};

type RenameFormProps = {
  design: DesignListItem;
  pending: boolean;
  onConfirm: (design: DesignListItem, name: string) => void;
  onClose: () => void;
};

export const DeleteDesignDialog = ({
  design,
  pending,
  onConfirm,
  onClose,
}: DeleteDesignDialogProps) => (
  <Dialog open={design !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-heading">Delete Design</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{design?.name}</span>? This action cannot
          be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={() => design && onConfirm(design)}
          disabled={pending}
        >
          {pending ? "Deleting..." : "Delete"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export const RenameDesignDialog = ({
  design,
  pending,
  onConfirm,
  onClose,
}: RenameDesignDialogProps) => (
  <Dialog open={design !== null} onOpenChange={(open) => !open && onClose()}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="font-heading">Rename Design</DialogTitle>
        <DialogDescription>Enter a new name for this design.</DialogDescription>
      </DialogHeader>
      {design && (
        <RenameForm
          key={design.id}
          design={design}
          pending={pending}
          onConfirm={onConfirm}
          onClose={onClose}
        />
      )}
    </DialogContent>
  </Dialog>
);

const RenameForm = ({ design, pending, onConfirm, onClose }: RenameFormProps) => {
  const [name, setName] = useState(design.name);
  const trimmed = name.trim();

  const submit = () => {
    if (pending || !trimmed) return;
    if (trimmed === design.name) return onClose();
    onConfirm(design, trimmed);
  };

  return (
    <>
      <div className="py-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Design name"
          maxLength={DESIGN_NAME_MAX_CHARS}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={!trimmed || pending}>
          {pending ? "Renaming…" : "Rename"}
        </Button>
      </DialogFooter>
    </>
  );
};
