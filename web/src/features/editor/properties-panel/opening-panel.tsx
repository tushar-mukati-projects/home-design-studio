"use client";

import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { clampOpeningOffset } from "@/lib/canvas";
import { OPENING_WIDTH_MAX_MM, OPENING_WIDTH_MIN_MM, formatLength } from "@/lib/constants";
import { wallLength, type DoorVariant, type Opening, type Wall } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { DeleteButton, FieldLabel, Section, Toggle } from "./fields";

const OPENING_WIDTH_STEP_MM = 50;
const DOOR_HEIGHT_MIN_MM = 1800;
const DOOR_HEIGHT_MAX_MM = 2400;
const WINDOW_HEIGHT_MIN_MM = 300;
const WINDOW_HEIGHT_MAX_MM = 2500;
const OPENING_HEIGHT_STEP_MM = 50;
const OPENING_OFFSET_STEP_MM = 10;
const SILL_MIN_MM = 0;
const SILL_MAX_MM = 1500;
const SILL_STEP_MM = 50;

const DOOR_VARIANT_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "sliding", label: "Sliding" },
];

const HINGE_OPTIONS: ["left" | "right", string][] = [
  ["left", "Left"],
  ["right", "Right"],
];

const SWING_OPTIONS: ["in" | "out", string][] = [
  ["in", "Inward"],
  ["out", "Outward"],
];

type OpeningPanelProps = {
  opening: Opening;
  wall: Wall;
};

export const OpeningPanel = ({ opening, wall }: OpeningPanelProps) => {
  const updateOpening = useEditorStore((s) => s.updateOpening);
  const removeOpening = useEditorStore((s) => s.removeOpening);
  const isDoor = opening.kind === "door";
  const label = isDoor ? "Door" : "Window";
  const halfWidth = Math.round(opening.width / 2);

  return (
    <Section title={`${label} Properties`}>
      {isDoor && (
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select
            value={opening.variant ?? "single"}
            options={DOOR_VARIANT_OPTIONS}
            onValueChange={(variant) =>
              updateOpening(opening.id, { variant: variant as DoorVariant })
            }
          />
        </div>
      )}

      <div>
        <FieldLabel>Width ({opening.width} mm)</FieldLabel>
        <Slider
          value={opening.width}
          min={OPENING_WIDTH_MIN_MM}
          max={OPENING_WIDTH_MAX_MM}
          step={OPENING_WIDTH_STEP_MM}
          onValueChange={(width) =>
            updateOpening(
              opening.id,
              { width, offset: clampOpeningOffset({ width }, wall, opening.offset) },
              `opening-width:${opening.id}`,
            )
          }
        />
      </div>

      <div>
        <FieldLabel>Height ({opening.height} mm)</FieldLabel>
        <Slider
          value={opening.height}
          min={isDoor ? DOOR_HEIGHT_MIN_MM : WINDOW_HEIGHT_MIN_MM}
          max={isDoor ? DOOR_HEIGHT_MAX_MM : WINDOW_HEIGHT_MAX_MM}
          step={OPENING_HEIGHT_STEP_MM}
          onValueChange={(height) =>
            updateOpening(opening.id, { height }, `opening-height:${opening.id}`)
          }
        />
      </div>

      <div>
        <FieldLabel>Position along wall ({formatLength(opening.offset)})</FieldLabel>
        <Slider
          value={opening.offset}
          min={halfWidth}
          max={Math.max(halfWidth, Math.round(wallLength(wall) - opening.width / 2))}
          step={OPENING_OFFSET_STEP_MM}
          onValueChange={(offset) =>
            updateOpening(opening.id, { offset }, `opening-offset:${opening.id}`)
          }
        />
      </div>

      {!isDoor && (
        <div>
          <FieldLabel>Sill height ({opening.sill ?? 0} mm)</FieldLabel>
          <Slider
            value={opening.sill ?? 0}
            min={SILL_MIN_MM}
            max={SILL_MAX_MM}
            step={SILL_STEP_MM}
            onValueChange={(sill) =>
              updateOpening(opening.id, { sill }, `opening-sill:${opening.id}`)
            }
          />
        </div>
      )}

      {isDoor && opening.variant !== "sliding" && (
        <div className="space-y-2">
          <FieldLabel>Hinge</FieldLabel>
          <Toggle
            value={opening.hinge ?? "left"}
            options={HINGE_OPTIONS}
            onChange={(hinge) => updateOpening(opening.id, { hinge })}
          />
          <FieldLabel>Swing</FieldLabel>
          <Toggle
            value={opening.swing ?? "in"}
            options={SWING_OPTIONS}
            onChange={(swing) => updateOpening(opening.id, { swing })}
          />
        </div>
      )}

      <Separator />
      <DeleteButton label={`Delete ${label}`} onClick={() => removeOpening(opening.id)} />
    </Section>
  );
};
