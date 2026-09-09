"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/stores/editor-store";
import { formatArea, formatLength } from "@/lib/constants";
import {
  ROOM_USAGE_LABELS,
  clampOpeningOffset,
  furnitureName,
  furnitureSize,
  polygonArea,
  wallAngle,
  wallLength,
} from "@/lib/canvas";
import {
  ROOM_USAGES,
  type DoorVariant,
  type Furniture,
  type Opening,
  type RoomUsage,
  type Vec2,
  type Wall,
} from "@/types";

const WALL_COLORS = [
  "#3a3a4a",
  "#5a5a6a",
  "#7a7a8a",
  "#4a4a5a",
  "#2c2c3e",
  "#1a1a2e",
  "#0f0f1e",
  "#2c2c2e",
];

const ROOM_USAGE_OPTIONS = ROOM_USAGES.map((value) => ({ value, label: ROOM_USAGE_LABELS[value] }));

const metres = (mm: number) => (mm / 1000).toFixed(2);
const toMm = (raw: string): number | null => {
  const m = parseFloat(raw);
  return Number.isNaN(m) ? null : Math.round(m * 1000);
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex h-full flex-col">
    <div className="border-b border-[var(--border)] px-4 py-3">
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
    </div>
    <div className="flex-1 space-y-5 overflow-y-auto p-4">{children}</div>
  </div>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
    {children}
  </label>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-[var(--muted-foreground)]">{label}</span>
    <span className="font-mono text-xs text-[var(--foreground)]">{value}</span>
  </div>
);

const MetresInput = ({
  id,
  mm,
  onCommit,
}: {
  id: string;
  mm: number;
  onCommit: (mm: number) => void;
}) => {
  const commit = (raw: string) => {
    const value = toMm(raw);
    if (value !== null) onCommit(value);
  };
  return (
    <Input
      type="number"
      step="0.01"
      defaultValue={metres(mm)}
      key={`${id}-${mm}`}
      className="h-8 text-xs"
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
      }}
    />
  );
};

const PointInputs = ({
  id,
  point,
  onChange,
}: {
  id: string;
  point: Vec2;
  onChange: (p: Vec2) => void;
}) => (
  <div className="grid grid-cols-2 gap-2">
    <div>
      <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">X (m)</label>
      <MetresInput id={`${id}-x`} mm={point[0]} onCommit={(x) => onChange([x, point[1]])} />
    </div>
    <div>
      <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">Y (m)</label>
      <MetresInput id={`${id}-y`} mm={point[1]} onCommit={(y) => onChange([point[0], y])} />
    </div>
  </div>
);

const Toggle = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) => (
  <div className="flex gap-2">
    {options.map(([v, label]) => (
      <button
        key={v}
        className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
          value === v
            ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
            : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        }`}
        onClick={() => onChange(v)}
      >
        {label}
      </button>
    ))}
  </div>
);

const DeleteButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button variant="destructive" size="sm" className="w-full gap-2" onClick={onClick}>
    <Trash2 className="h-3.5 w-3.5" />
    {label}
  </Button>
);

const WallPanel = ({ wall }: { wall: Wall }) => {
  const updateWall = useEditorStore((s) => s.updateWall);
  const removeWall = useEditorStore((s) => s.removeWall);
  const angle = (wallAngle(wall) * 180) / Math.PI;

  return (
    <Section title="Wall Properties">
      <div>
        <Label>Thickness ({wall.thickness} mm)</Label>
        <Slider
          value={wall.thickness}
          min={50}
          max={500}
          step={10}
          onValueChange={(val) =>
            updateWall(wall.id, { thickness: val }, `wall-thickness:${wall.id}`)
          }
        />
      </div>

      <div>
        <Label>Height ({wall.height} mm)</Label>
        <Slider
          value={wall.height}
          min={2000}
          max={4000}
          step={50}
          onValueChange={(val) => updateWall(wall.id, { height: val }, `wall-height:${wall.id}`)}
        />
      </div>

      <div>
        <Label>Color</Label>
        <div className="grid grid-cols-4 gap-2">
          {WALL_COLORS.map((color) => (
            <button
              key={color}
              className="h-8 w-full rounded-md border-2 transition-all hover:scale-105"
              style={{
                backgroundColor: color,
                borderColor: wall.color === color ? "#2c2c2e" : "transparent",
              }}
              onClick={() => updateWall(wall.id, { color })}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium text-[var(--muted-foreground)]">Start Point</p>
        <PointInputs
          id={`${wall.id}-from`}
          point={wall.from}
          onChange={(from) => updateWall(wall.id, { from })}
        />
        <p className="text-xs font-medium text-[var(--muted-foreground)]">End Point</p>
        <PointInputs
          id={`${wall.id}-to`}
          point={wall.to}
          onChange={(to) => updateWall(wall.id, { to })}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Row label="Length" value={formatLength(wallLength(wall))} />
        <Row label="Angle" value={`${angle.toFixed(1)}°`} />
      </div>

      <Separator />
      <DeleteButton label="Delete Wall" onClick={() => removeWall(wall.id)} />
    </Section>
  );
};

const OpeningPanel = ({ opening, wall }: { opening: Opening; wall: Wall | undefined }) => {
  const updateOpening = useEditorStore((s) => s.updateOpening);
  const removeOpening = useEditorStore((s) => s.removeOpening);
  const isDoor = opening.kind === "door";
  const label = isDoor ? "Door" : "Window";
  const length = wall ? wallLength(wall) : opening.offset * 2;

  return (
    <Section title={`${label} Properties`}>
      {isDoor && (
        <div>
          <Label>Type</Label>
          <Select
            value={opening.variant ?? "single"}
            options={[
              { value: "single", label: "Single" },
              { value: "double", label: "Double" },
              { value: "sliding", label: "Sliding" },
            ]}
            onValueChange={(val) => updateOpening(opening.id, { variant: val as DoorVariant })}
          />
        </div>
      )}

      <div>
        <Label>Width ({opening.width} mm)</Label>
        <Slider
          value={opening.width}
          min={300}
          max={3000}
          step={50}
          onValueChange={(val) =>
            updateOpening(
              opening.id,
              {
                width: val,
                offset: wall
                  ? clampOpeningOffset({ width: val }, wall, opening.offset)
                  : opening.offset,
              },
              `opening-width:${opening.id}`,
            )
          }
        />
      </div>

      <div>
        <Label>Height ({opening.height} mm)</Label>
        <Slider
          value={opening.height}
          min={isDoor ? 1800 : 300}
          max={isDoor ? 2400 : 2500}
          step={50}
          onValueChange={(val) =>
            updateOpening(opening.id, { height: val }, `opening-height:${opening.id}`)
          }
        />
      </div>

      <div>
        <Label>Position along wall ({formatLength(opening.offset)})</Label>
        <Slider
          value={opening.offset}
          min={Math.round(opening.width / 2)}
          max={Math.max(Math.round(opening.width / 2), Math.round(length - opening.width / 2))}
          step={10}
          onValueChange={(val) =>
            updateOpening(opening.id, { offset: val }, `opening-offset:${opening.id}`)
          }
        />
      </div>

      {!isDoor && (
        <div>
          <Label>Sill height ({opening.sill ?? 0} mm)</Label>
          <Slider
            value={opening.sill ?? 0}
            min={0}
            max={1500}
            step={50}
            onValueChange={(val) =>
              updateOpening(opening.id, { sill: val }, `opening-sill:${opening.id}`)
            }
          />
        </div>
      )}

      {isDoor && opening.variant !== "sliding" && (
        <div className="space-y-2">
          <Label>Hinge</Label>
          <Toggle
            value={opening.hinge ?? "left"}
            options={[
              ["left", "Left"],
              ["right", "Right"],
            ]}
            onChange={(hinge) => updateOpening(opening.id, { hinge })}
          />
          <Label>Swing</Label>
          <Toggle
            value={opening.swing ?? "in"}
            options={[
              ["in", "Inward"],
              ["out", "Outward"],
            ]}
            onChange={(swing) => updateOpening(opening.id, { swing })}
          />
        </div>
      )}

      <Separator />
      <DeleteButton label={`Delete ${label}`} onClick={() => removeOpening(opening.id)} />
    </Section>
  );
};

const FurniturePanel = ({ piece }: { piece: Furniture }) => {
  const catalog = useEditorStore((s) => s.catalog);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const removeFurniture = useEditorStore((s) => s.removeFurniture);
  const [width, depth, height] = furnitureSize(piece, catalog);

  const setSize = (index: 0 | 1, raw: string) => {
    const value = toMm(raw);
    if (value === null || value < 100) return;
    const size: [number, number, number] = [width, depth, height];
    size[index] = value;
    updateFurniture(piece.id, { size });
  };

  return (
    <Section title="Furniture Properties">
      <div>
        <Label>Name</Label>
        <p className="text-sm text-[var(--foreground)]">{furnitureName(piece, catalog)}</p>
      </div>

      <Separator />

      <div>
        <Label>Position</Label>
        <PointInputs
          id={piece.id}
          point={piece.at}
          onChange={(at) => updateFurniture(piece.id, { at })}
        />
      </div>

      <div>
        <Label>Rotation ({Math.round(piece.rotation)}°)</Label>
        <Slider
          value={piece.rotation}
          min={0}
          max={360}
          step={1}
          onValueChange={(val) =>
            updateFurniture(piece.id, { rotation: val }, `furniture-rotation:${piece.id}`)
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">Width (m)</label>
          <Input
            type="number"
            step="0.05"
            defaultValue={metres(width)}
            key={`w-${piece.id}-${width}`}
            className="h-8 text-xs"
            onBlur={(e) => setSize(0, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSize(0, (e.target as HTMLInputElement).value);
            }}
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">Depth (m)</label>
          <Input
            type="number"
            step="0.05"
            defaultValue={metres(depth)}
            key={`d-${piece.id}-${depth}`}
            className="h-8 text-xs"
            onBlur={(e) => setSize(1, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSize(1, (e.target as HTMLInputElement).value);
            }}
          />
        </div>
      </div>

      <Separator />
      <DeleteButton label="Delete Furniture" onClick={() => removeFurniture(piece.id)} />
    </Section>
  );
};

const RoomPanel = ({
  room,
}: {
  room: { id: string; name: string; usage: RoomUsage; polygon: Vec2[] };
}) => {
  const rooms = useEditorStore((s) => s.rooms);
  const setRooms = useEditorStore((s) => s.setRooms);
  const removeElement = useEditorStore((s) => s.removeElement);

  const commit = (patch: Partial<typeof room>) => {
    setRooms(
      rooms.map((r) => (r.id === room.id ? { ...r, ...patch } : r)),
      { recordHistory: true },
    );
  };

  return (
    <Section title="Room Properties">
      <div>
        <Label>Room Name</Label>
        <Input
          defaultValue={room.name}
          key={`room-name-${room.id}`}
          onBlur={(e) => commit({ name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit({ name: (e.target as HTMLInputElement).value });
          }}
          className="h-8 text-xs"
        />
      </div>

      <div>
        <Label>Room Type</Label>
        <Select
          value={room.usage}
          options={ROOM_USAGE_OPTIONS}
          onValueChange={(val) => commit({ usage: val as RoomUsage })}
        />
      </div>

      <Separator />
      <Row label="Area" value={formatArea(polygonArea(room.polygon))} />
      <Separator />
      <DeleteButton label="Delete Room" onClick={() => removeElement(room.id)} />
    </Section>
  );
};

export const PropertiesPanel = () => {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);

  const selected = useMemo(() => {
    if (!selectedElementId) return null;
    const wall = walls.find((w) => w.id === selectedElementId);
    if (wall) return { kind: "wall" as const, wall };
    const opening = openings.find((o) => o.id === selectedElementId);
    if (opening)
      return { kind: "opening" as const, opening, wall: walls.find((w) => w.id === opening.wall) };
    const piece = furniture.find((f) => f.id === selectedElementId);
    if (piece) return { kind: "furniture" as const, piece };
    const room = rooms.find((r) => r.id === selectedElementId);
    if (room) return { kind: "room" as const, room };
    return null;
  }, [selectedElementId, walls, openings, furniture, rooms]);

  if (!selected) {
    return (
      <Section title="Properties">
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-sm text-[var(--muted-foreground)]">
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
