"use client";

import { useMemo } from "react";
import { Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useEditorStore } from "@/stores/editor-store";
import { feetToPx, pxToFeet, pxToSquareFeet } from "@/lib/constants";

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

const ROOM_COLORS = [
  "#2c2c2e30",
  "#6B5B9530",
  "#C4564530",
  "#4A7FB530",
  "#2EA85A30",
  "#D4862030",
  "#D4567830",
  "#8a8a9430",
];

const pxToFt = (px: number) => pxToFeet(px).toFixed(1);
const ftToPx = feetToPx;

const ROOM_TYPE_OPTIONS = [
  { value: "living_room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office" },
  { value: "dining", label: "Dining Room" },
  { value: "hallway", label: "Hallway" },
  { value: "closet", label: "Closet" },
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

    const handleCoordChange = (field: "x1" | "y1" | "x2" | "y2", raw: string) => {
      const ft = parseFloat(raw);
      if (isNaN(ft)) return;
      updateWall(selectedWall.id, { [field]: ftToPx(ft) });
    };

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
              onValueChange={(val) =>
                updateWall(selectedWall.id, { thickness: val }, `wall-thickness:${selectedWall.id}`)
              }
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
                    borderColor: selectedWall.color === color ? "#2c2c2e" : "transparent",
                  }}
                  onClick={() => updateWall(selectedWall.id, { color })}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--muted-foreground)]">Start Point</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">
                  X (ft)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={parseFloat(pxToFt(selectedWall.x1))}
                  key={`x1-${selectedWall.id}-${selectedWall.x1}`}
                  className="h-8 text-xs"
                  onBlur={(e) => handleCoordChange("x1", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleCoordChange("x1", (e.target as HTMLInputElement).value);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">
                  Y (ft)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={parseFloat(pxToFt(selectedWall.y1))}
                  key={`y1-${selectedWall.id}-${selectedWall.y1}`}
                  className="h-8 text-xs"
                  onBlur={(e) => handleCoordChange("y1", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleCoordChange("y1", (e.target as HTMLInputElement).value);
                  }}
                />
              </div>
            </div>

            <p className="text-xs font-medium text-[var(--muted-foreground)]">End Point</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">
                  X (ft)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={parseFloat(pxToFt(selectedWall.x2))}
                  key={`x2-${selectedWall.id}-${selectedWall.x2}`}
                  className="h-8 text-xs"
                  onBlur={(e) => handleCoordChange("x2", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleCoordChange("x2", (e.target as HTMLInputElement).value);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-[var(--muted-foreground)]">
                  Y (ft)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  defaultValue={parseFloat(pxToFt(selectedWall.y2))}
                  key={`y2-${selectedWall.id}-${selectedWall.y2}`}
                  className="h-8 text-xs"
                  onBlur={(e) => handleCoordChange("y2", e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      handleCoordChange("y2", (e.target as HTMLInputElement).value);
                  }}
                />
              </div>
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
                {wallAngle.toFixed(1)}°
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
              onValueChange={(val) =>
                updateDoor(selectedDoor.id, { width: val }, `door-width:${selectedDoor.id}`)
              }
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
              onValueChange={(val) =>
                updateDoor(
                  selectedDoor.id,
                  { position: val / 100 },
                  `door-position:${selectedDoor.id}`,
                )
              }
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
              onValueChange={(val) =>
                updateWindow(selectedWindow.id, { width: val }, `window-width:${selectedWindow.id}`)
              }
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
              onValueChange={(val) =>
                updateWindow(
                  selectedWindow.id,
                  { position: val / 100 },
                  `window-position:${selectedWindow.id}`,
                )
              }
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
    const commitFurniturePos = (field: "x" | "y", raw: string) => {
      const ft = parseFloat(raw);
      if (isNaN(ft)) return;
      updateFurniture(selectedFurniture.id, { [field]: ftToPx(ft) });
    };

    const commitFurnitureScale = (field: "scaleX" | "scaleY", raw: string) => {
      const val = parseFloat(raw);
      if (isNaN(val)) return;
      updateFurniture(selectedFurniture.id, { [field]: Math.min(5, Math.max(0.1, val)) });
    };

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
                defaultValue={parseFloat(pxToFt(selectedFurniture.x))}
                key={`fx-${selectedFurniture.id}-${selectedFurniture.x}`}
                onBlur={(e) => commitFurniturePos("x", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    commitFurniturePos("x", (e.target as HTMLInputElement).value);
                }}
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
                defaultValue={parseFloat(pxToFt(selectedFurniture.y))}
                key={`fy-${selectedFurniture.id}-${selectedFurniture.y}`}
                onBlur={(e) => commitFurniturePos("y", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    commitFurniturePos("y", (e.target as HTMLInputElement).value);
                }}
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
              onValueChange={(val) =>
                updateFurniture(
                  selectedFurniture.id,
                  { rotation: val },
                  `furniture-rotation:${selectedFurniture.id}`,
                )
              }
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
                defaultValue={selectedFurniture.scaleX.toFixed(1)}
                key={`fsx-${selectedFurniture.id}-${selectedFurniture.scaleX}`}
                onBlur={(e) => commitFurnitureScale("scaleX", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    commitFurnitureScale("scaleX", (e.target as HTMLInputElement).value);
                }}
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
                defaultValue={selectedFurniture.scaleY.toFixed(1)}
                key={`fsy-${selectedFurniture.id}-${selectedFurniture.scaleY}`}
                onBlur={(e) => commitFurnitureScale("scaleY", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    commitFurnitureScale("scaleY", (e.target as HTMLInputElement).value);
                }}
                className="h-8 text-xs"
              />
            </div>
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
    const commitRoom = (patch: Partial<typeof selectedRoom>) => {
      useEditorStore.getState().pushHistory();
      setRooms(rooms.map((r) => (r.id === selectedRoom.id ? { ...r, ...patch } : r)));
    };

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
              defaultValue={selectedRoom.name}
              key={`room-name-${selectedRoom.id}`}
              onBlur={(e) => commitRoom({ name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRoom({ name: (e.target as HTMLInputElement).value });
              }}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
              Room Type
            </label>
            <Select
              value={selectedRoom.type.replace(/-/g, "_")}
              options={ROOM_TYPE_OPTIONS}
              onValueChange={(val) => commitRoom({ type: val })}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--muted-foreground)]">Area</span>
            <span className="font-mono text-xs text-[var(--foreground)]">
              {pxToSquareFeet(selectedRoom.area).toFixed(1)} sq ft
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
                    borderColor: selectedRoom.color === color ? "#2c2c2e" : "transparent",
                  }}
                  onClick={() => commitRoom({ color })}
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
