"use client";

import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { toDegrees, wallAngle } from "@/lib/canvas";
import { formatLength } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { wallLength, type Wall } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { DeleteButton, FieldLabel, PointInputs, Row, Section } from "./fields";

const WALL_THICKNESS_MIN_MM = 50;
const WALL_THICKNESS_MAX_MM = 500;
const WALL_THICKNESS_STEP_MM = 10;
const WALL_HEIGHT_MIN_MM = 2000;
const WALL_HEIGHT_MAX_MM = 4000;
const WALL_HEIGHT_STEP_MM = 50;

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

type WallPanelProps = {
  wall: Wall;
};

export const WallPanel = ({ wall }: WallPanelProps) => {
  const updateWall = useEditorStore((s) => s.updateWall);
  const removeWall = useEditorStore((s) => s.removeWall);
  const angle = toDegrees(wallAngle(wall));

  return (
    <Section title="Wall Properties">
      <div>
        <FieldLabel>Thickness ({wall.thickness} mm)</FieldLabel>
        <Slider
          value={wall.thickness}
          min={WALL_THICKNESS_MIN_MM}
          max={WALL_THICKNESS_MAX_MM}
          step={WALL_THICKNESS_STEP_MM}
          onValueChange={(thickness) =>
            updateWall(wall.id, { thickness }, `wall-thickness:${wall.id}`)
          }
        />
      </div>

      <div>
        <FieldLabel>Height ({wall.height} mm)</FieldLabel>
        <Slider
          value={wall.height}
          min={WALL_HEIGHT_MIN_MM}
          max={WALL_HEIGHT_MAX_MM}
          step={WALL_HEIGHT_STEP_MM}
          onValueChange={(height) => updateWall(wall.id, { height }, `wall-height:${wall.id}`)}
        />
      </div>

      <div>
        <FieldLabel>Color</FieldLabel>
        <div className="grid grid-cols-4 gap-2">
          {WALL_COLORS.map((color) => (
            <button
              key={color}
              aria-label={color}
              className={cn(
                "h-8 w-full rounded-md transition-all hover:scale-105",
                wall.color === color && "ring-2 ring-ring ring-offset-1",
              )}
              style={{ backgroundColor: color }}
              onClick={() => updateWall(wall.id, { color })}
            />
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Start Point</p>
        <PointInputs
          id={`${wall.id}-from`}
          point={wall.from}
          onChange={(from) => updateWall(wall.id, { from })}
        />
        <p className="text-xs font-medium text-muted-foreground">End Point</p>
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
