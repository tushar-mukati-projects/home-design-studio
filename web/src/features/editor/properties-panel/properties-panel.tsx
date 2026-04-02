"use client";

import { useMemo } from "react";
import { Trash2, ArrowUpToLine, ArrowDownToLine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/stores/editor-store";

const WALL_COLORS = [
  "#6B5B4D",
  "#8B7D6B",
  "#A0937D",
  "#5A4E42",
  "#4A4038",
  "#3A3530",
  "#2A2520",
  "#D4A853",
];

const ROOM_COLORS = [
  "#D4A85330",
  "#7B68EE30",
  "#FF634730",
  "#4682B430",
  "#32CD3230",
  "#FF8C0030",
  "#FF69B430",
  "#8A827830",
];

const PIXELS_PER_FOOT = 30;
const pxToFt = (px: number) => (px / PIXELS_PER_FOOT).toFixed(1);
const ftToPx = (ft: number) => ft * PIXELS_PER_FOOT;

const ROOM_TYPE_OPTIONS = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office" },
  { value: "dining", label: "Dining Room" },
  { value: "generic", label: "Generic" },
];

export const PropertiesPanel = () => {
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const walls = useEditorStore((s) => s.walls);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);
  const updateWall = useEditorStore((s) => s.updateWall);
  const removeWall = useEditorStore((s) => s.removeWall);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const removeDoor = useEditorStore((s) => s.removeDoor);
  const updateDoor = useEditorStore((s) => s.updateDoor);
  const removeWindow = useEditorStore((s) => s.removeWindow);
  const updateWindow = useEditorStore((s) => s.updateWindow);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const removeFurniture = useEditorStore((s) => s.removeFurniture);
  const setRooms = useEditorStore((s) => s.setRooms);

  const selectedWall = useMemo(
    () => walls.find((w) => w.id === selectedElementId),
    [walls, selectedElementId],
  );

  const selectedFurniture = useMemo(
    () => furniture.find((f) => f.id === selectedElementId),
    [furniture, selectedElementId],
  );

  const selectedDoor = useMemo(
    () => doors.find((d) => d.id === selectedElementId),
    [doors, selectedElementId],
  );

  const selectedWindow = useMemo(
    () => windows.find((w) => w.id === selectedElementId),
    [windows, selectedElementId],
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedElementId),
    [rooms, selectedElementId],
  );

  if (
    !selectedElementId ||
    (!selectedWall && !selectedFurniture && !selectedRoom && !selectedDoor && !selectedWindow)
  ) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <p className="text-center text-sm text-[var(--muted-foreground)]">
            Select an element to edit its properties
          </p>
        </div>
      </div>
    );
  }

  if (selectedWall) {
    const wallLength = Math.sqrt(
      (selectedWall.x2 - selectedWall.x1) ** 2 + (selectedWall.y2 - selectedWall.y1) ** 2,
    );
    const wallAngle =
      (Math.atan2(selectedWall.y2 - selectedWall.y1, selectedWall.x2 - selectedWall.x1) * 180) /
      Math.PI;

    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Wall Properties</h3>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Thickness ({pxToFt(selectedWall.thickness)} ft)
            </label>
            <Slider
              value={selectedWall.thickness}
              min={5}
              max={30}
              step={1}
              onValueChange={(val) => updateWall(selectedWall.id, { thickness: val })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {WALL_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-8 w-full rounded-md border-2 transition-all hover:scale-105"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedWall.color === color ? "#D4A853" : "transparent",
                  }}
                  onClick={() => updateWall(selectedWall.id, { color })}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">Length</span>
              <span className="font-mono text-xs text-[var(--foreground)]">
                {pxToFt(wallLength)} ft
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--muted-foreground)]">Angle</span>
              <span className="font-mono text-xs text-[var(--foreground)]">
                {wallAngle.toFixed(1)}deg
              </span>
            </div>
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => removeWall(selectedWall.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Wall
          </Button>
        </div>
      </div>
    );
  }

  if (selectedDoor) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Door Properties</h3>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Type
            </label>
            <Select
              value={selectedDoor.type}
              options={[
                { value: "single", label: "Single" },
                { value: "double", label: "Double" },
                { value: "sliding", label: "Sliding" },
              ]}
              onValueChange={(val) =>
                updateDoor(selectedDoor.id, { type: val as "single" | "double" | "sliding" })
              }
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Width ({pxToFt(selectedDoor.width)} ft)
            </label>
            <Slider
              value={selectedDoor.width}
              min={30}
              max={200}
              step={5}
              onValueChange={(val) => updateDoor(selectedDoor.id, { width: val })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Position ({(selectedDoor.position * 100).toFixed(0)}%)
            </label>
            <Slider
              value={selectedDoor.position * 100}
              min={5}
              max={95}
              step={1}
              onValueChange={(val) => updateDoor(selectedDoor.id, { position: val / 100 })}
            />
          </div>

          {selectedDoor.type !== "sliding" && (
            <div>
              <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
                Swing Direction
              </label>
              <div className="flex gap-2">
                <button
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    !selectedDoor.flipHinge
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  onClick={() => updateDoor(selectedDoor.id, { flipHinge: false })}
                >
                  Hinge Left
                </button>
                <button
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    selectedDoor.flipHinge
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  onClick={() => updateDoor(selectedDoor.id, { flipHinge: true })}
                >
                  Hinge Right
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    !selectedDoor.flipSwing
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  onClick={() => updateDoor(selectedDoor.id, { flipSwing: false })}
                >
                  Open Front
                </button>
                <button
                  className={`flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                    selectedDoor.flipSwing
                      ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  }`}
                  onClick={() => updateDoor(selectedDoor.id, { flipSwing: true })}
                >
                  Open Back
                </button>
              </div>
            </div>
          )}

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => removeDoor(selectedDoor.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Door
          </Button>
        </div>
      </div>
    );
  }

  if (selectedWindow) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Window Properties</h3>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Width ({pxToFt(selectedWindow.width)} ft)
            </label>
            <Slider
              value={selectedWindow.width}
              min={20}
              max={150}
              step={5}
              onValueChange={(val) => updateWindow(selectedWindow.id, { width: val })}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Position ({(selectedWindow.position * 100).toFixed(0)}%)
            </label>
            <Slider
              value={selectedWindow.position * 100}
              min={5}
              max={95}
              step={1}
              onValueChange={(val) => updateWindow(selectedWindow.id, { position: val / 100 })}
            />
          </div>

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => removeWindow(selectedWindow.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Window
          </Button>
        </div>
      </div>
    );
  }

  if (selectedFurniture) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Furniture Properties</h3>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Name
            </label>
            <p className="text-sm text-[var(--foreground)]">
              {selectedFurniture.furnitureItem.name}
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                X (ft)
              </label>
              <Input
                type="number"
                step="0.1"
                value={pxToFt(selectedFurniture.x)}
                onChange={(e) =>
                  updateFurniture(selectedFurniture.id, {
                    x: ftToPx(Number(e.target.value)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Y (ft)
              </label>
              <Input
                type="number"
                step="0.1"
                value={pxToFt(selectedFurniture.y)}
                onChange={(e) =>
                  updateFurniture(selectedFurniture.id, {
                    y: ftToPx(Number(e.target.value)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Rotation ({Math.round(selectedFurniture.rotation)}deg)
            </label>
            <Slider
              value={selectedFurniture.rotation}
              min={0}
              max={360}
              step={1}
              onValueChange={(val) => updateFurniture(selectedFurniture.id, { rotation: val })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Scale X
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={selectedFurniture.scaleX.toFixed(1)}
                onChange={(e) =>
                  updateFurniture(selectedFurniture.id, {
                    scaleX: Math.max(0.1, Number(e.target.value)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Scale Y
              </label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="5"
                value={selectedFurniture.scaleY.toFixed(1)}
                onChange={(e) =>
                  updateFurniture(selectedFurniture.id, {
                    scaleY: Math.max(0.1, Number(e.target.value)),
                  })
                }
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Color
            </label>
            <div
              className="h-8 w-full rounded-md border border-[var(--border)]"
              style={{ backgroundColor: selectedFurniture.furnitureItem.color }}
            />
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={() => {
                const maxIndex = furniture.length - 1;
                const idx = furniture.findIndex((f) => f.id === selectedFurniture.id);
                if (idx < maxIndex) {
                  const reordered = [...furniture];
                  const [item] = reordered.splice(idx, 1);
                  reordered.push(item);
                  const store = useEditorStore.getState();
                  store.pushHistory();
                  useEditorStore.setState({ furniture: reordered });
                }
              }}
            >
              <ArrowUpToLine className="h-3 w-3" />
              Front
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-xs"
              onClick={() => {
                const idx = furniture.findIndex((f) => f.id === selectedFurniture.id);
                if (idx > 0) {
                  const reordered = [...furniture];
                  const [item] = reordered.splice(idx, 1);
                  reordered.unshift(item);
                  const store = useEditorStore.getState();
                  store.pushHistory();
                  useEditorStore.setState({ furniture: reordered });
                }
              }}
            >
              <ArrowDownToLine className="h-3 w-3" />
              Back
            </Button>
          </div>

          <Button
            variant="destructive"
            size="sm"
            className="w-full gap-2"
            onClick={() => removeFurniture(selectedFurniture.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Furniture
          </Button>
        </div>
      </div>
    );
  }

  if (selectedRoom) {
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--foreground)]">Room Properties</h3>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Room Name
            </label>
            <Input
              value={selectedRoom.name}
              onChange={(e) => {
                const updated = rooms.map((r) =>
                  r.id === selectedRoom.id ? { ...r, name: e.target.value } : r,
                );
                setRooms(updated);
              }}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Room Type
            </label>
            <Select
              value={selectedRoom.type}
              options={ROOM_TYPE_OPTIONS}
              onValueChange={(val) => {
                const updated = rooms.map((r) =>
                  r.id === selectedRoom.id ? { ...r, type: val } : r,
                );
                setRooms(updated);
              }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Area</span>
            <span className="font-mono text-xs text-[var(--foreground)]">
              {(selectedRoom.area / (PIXELS_PER_FOOT * PIXELS_PER_FOOT)).toFixed(1)} sq ft
            </span>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-[var(--muted-foreground)]">
              Color
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ROOM_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-8 w-full rounded-md border-2 transition-all hover:scale-105"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedRoom.color === color ? "#D4A853" : "transparent",
                  }}
                  onClick={() => {
                    const updated = rooms.map((r) =>
                      r.id === selectedRoom.id ? { ...r, color } : r,
                    );
                    setRooms(updated);
                  }}
                />
              ))}
            </div>
          </div>

          <Separator />

          <Button
            size="sm"
            className="w-full gap-2 bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Furnish
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
