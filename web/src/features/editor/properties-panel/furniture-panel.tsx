"use client";

import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { furnitureName, furnitureSize } from "@/lib/canvas";
import { MIN_FURNITURE_SIDE_MM } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";
import type { Furniture, Size3 } from "@/shared/canvas";
import { DeleteButton, FieldLabel, MetresField, PointInputs, Section } from "./fields";

const ROTATION_MIN_DEG = 0;
const ROTATION_MAX_DEG = 360;
const ROTATION_STEP_DEG = 1;
const FURNITURE_SIZE_STEP_M = 0.05;

type FurniturePanelProps = {
  piece: Furniture;
};

export const FurniturePanel = ({ piece }: FurniturePanelProps) => {
  const catalog = useEditorStore((s) => s.catalog);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const removeFurniture = useEditorStore((s) => s.removeFurniture);
  const [width, depth, height] = furnitureSize(piece, catalog);

  const setSide = (index: 0 | 1, value: number) => {
    if (value < MIN_FURNITURE_SIDE_MM) return;
    const size: Size3 = [width, depth, height];
    size[index] = value;
    updateFurniture(piece.id, { size });
  };

  return (
    <Section title="Furniture Properties">
      <div>
        <FieldLabel>Name</FieldLabel>
        <p className="text-sm text-foreground">{furnitureName(piece, catalog)}</p>
      </div>

      <Separator />

      <div>
        <FieldLabel>Position</FieldLabel>
        <PointInputs
          id={piece.id}
          point={piece.at}
          onChange={(at) => updateFurniture(piece.id, { at })}
        />
      </div>

      <div>
        <FieldLabel>Rotation ({Math.round(piece.rotation)}°)</FieldLabel>
        <Slider
          value={piece.rotation}
          min={ROTATION_MIN_DEG}
          max={ROTATION_MAX_DEG}
          step={ROTATION_STEP_DEG}
          onValueChange={(rotation) =>
            updateFurniture(piece.id, { rotation }, `furniture-rotation:${piece.id}`)
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetresField
          id={`w-${piece.id}`}
          label="Width (m)"
          mm={width}
          step={FURNITURE_SIZE_STEP_M}
          onCommit={(value) => setSide(0, value)}
        />
        <MetresField
          id={`d-${piece.id}`}
          label="Depth (m)"
          mm={depth}
          step={FURNITURE_SIZE_STEP_M}
          onCommit={(value) => setSide(1, value)}
        />
      </div>

      <Separator />
      <DeleteButton label="Delete Furniture" onClick={() => removeFurniture(piece.id)} />
    </Section>
  );
};
