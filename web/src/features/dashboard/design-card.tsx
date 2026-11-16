"use client";

import { formatDistanceToNow } from "date-fns";
import { Armchair, Copy, DoorOpen, ExternalLink, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { DesignListItem } from "@/types";
import { CanvasPreview } from "./canvas-preview";

export type DesignCardVariant = "grid" | "list" | "shared";

export type DesignActions = {
  onDuplicate: (design: DesignListItem) => void;
  onRename: (design: DesignListItem) => void;
  onDelete: (design: DesignListItem) => void;
};

type DesignCardProps = {
  design: DesignListItem;
  variant: DesignCardVariant;
  onOpen: (design: DesignListItem) => void;
  actions?: DesignActions;
};

type DesignBadgesProps = {
  design: DesignListItem;
};

type DesignMenuProps = {
  design: DesignListItem;
  variant: DesignCardVariant;
  onOpen: (design: DesignListItem) => void;
  actions: DesignActions;
};

const updatedLabel = (design: DesignListItem) =>
  `Updated ${formatDistanceToNow(new Date(design.updatedAt), { addSuffix: true })}`;

export const DesignCard = ({ design, variant, onOpen, actions }: DesignCardProps) => (
  <div className="group relative">
    <Card className="cursor-pointer overflow-hidden" onClick={() => onOpen(design)}>
      {variant === "list" ? (
        <div className="flex items-center gap-4 p-4">
          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-md bg-secondary">
            <CanvasPreview
              canvas={{ walls: [], rooms: design.rooms, furniture: design.furniture }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{design.name}</h3>
            {design.description && (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{design.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DesignBadges design={design} />
              <span className="text-xs text-muted-foreground">{updatedLabel(design)}</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={cn("overflow-hidden bg-secondary", variant === "grid" ? "h-40" : "h-32")}>
            <CanvasPreview
              canvas={{ walls: [], rooms: design.rooms, furniture: design.furniture }}
            />
          </div>
          <CardContent className="p-4">
            <h3 className="truncate font-semibold text-foreground">{design.name}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {variant === "shared" ? (
                <SharedBadges design={design} />
              ) : (
                <DesignBadges design={design} />
              )}
            </div>
            {variant === "grid" && (
              <p className="mt-2 text-xs text-muted-foreground">{updatedLabel(design)}</p>
            )}
          </CardContent>
        </>
      )}
    </Card>
    {actions && <DesignMenu design={design} variant={variant} onOpen={onOpen} actions={actions} />}
  </div>
);

const DesignBadges = ({ design }: DesignBadgesProps) => (
  <>
    {design.rooms.length > 0 && (
      <Badge variant="secondary" className="gap-1 font-normal">
        <DoorOpen className="size-3" />
        {design.rooms.length} {design.rooms.length === 1 ? "room" : "rooms"}
      </Badge>
    )}
    {design.furniture.length > 0 && (
      <Badge variant="secondary" className="gap-1 font-normal">
        <Armchair className="size-3" />
        {design.furniture.length}
      </Badge>
    )}
  </>
);

const SharedBadges = ({ design }: DesignBadgesProps) => (
  <>
    <Badge variant="secondary" className="gap-1 text-xs font-normal">
      {design.ownerName ?? design.ownerEmail}
    </Badge>
    <Badge variant="secondary" className="text-xs font-normal">
      {design.permission === "readwrite" ? "Can edit" : "Can view"}
    </Badge>
  </>
);

const DesignMenu = ({ design, variant, onOpen, actions }: DesignMenuProps) => (
  <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="size-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onOpen(design)}>
          <ExternalLink className="mr-2 size-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onDuplicate(design)}>
          <Copy className="mr-2 size-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => actions.onRename(design)}>
          <Pencil className="mr-2 size-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => actions.onDelete(design)} className="text-destructive">
          <Trash2 className="mr-2 size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);
