"use client";

import { useMemo } from "react";
import type { Furniture, Opening, Room, Wall } from "@/shared/canvas";
import type { Collections } from "@/stores/editor-history";
import { useEditorStore } from "@/stores/editor-store";
import { Section } from "./fields";
import { FurniturePanel } from "./furniture-panel";
import { OpeningPanel } from "./opening-panel";
import { RoomPanel } from "./room-panel";
import { WallPanel } from "./wall-panel";

type Selection =
  | { kind: "wall"; wall: Wall }
  | { kind: "opening"; opening: Opening; wall: Wall }
  | { kind: "furniture"; piece: Furniture }
  | { kind: "room"; room: Room };

export const PropertiesPanel = () => {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);

  const selected = useMemo(
    () => resolveSelection(selectedElementId, { walls, openings, furniture, rooms }),
    [selectedElementId, walls, openings, furniture, rooms],
  );

  if (!selected) {
    return (
      <Section title="Properties">
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-sm text-muted-foreground">
            Select an item to edit its properties
          </p>
        </div>
      </Section>
    );
  }

  switch (selected.kind) {
    case "wall":
      return <WallPanel wall={selected.wall} />;
    case "opening":
      return <OpeningPanel opening={selected.opening} wall={selected.wall} />;
    case "furniture":
      return <FurniturePanel piece={selected.piece} />;
    case "room":
      return <RoomPanel room={selected.room} />;
  }
};

const resolveSelection = (id: string | null, canvas: Collections): Selection | null => {
  if (!id) return null;
  const wall = canvas.walls.find((w) => w.id === id);
  if (wall) return { kind: "wall", wall };
  const opening = canvas.openings.find((o) => o.id === id);
  if (opening) {
    const openingWall = canvas.walls.find((w) => w.id === opening.wall);
    return openingWall ? { kind: "opening", opening, wall: openingWall } : null;
  }
  const piece = canvas.furniture.find((f) => f.id === id);
  if (piece) return { kind: "furniture", piece };
  const room = canvas.rooms.find((r) => r.id === id);
  if (room) return { kind: "room", room };
  return null;
};
