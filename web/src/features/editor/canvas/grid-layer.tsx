"use client";

import { memo } from "react";
import { Layer, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";

interface GridLayerProps {
  width: number;
  height: number;
}

export const GridLayer = memo(function GridLayer({ width, height }: GridLayerProps) {
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const zoom = useEditorStore((s) => s.zoom);
  const panX = useEditorStore((s) => s.panX);
  const panY = useEditorStore((s) => s.panY);

  if (!showGrid) return null;

  // The stage is scaled by this, so everything below is in millimetres.
  const scale = zoom * PX_PER_MM;
  const px = 1 / scale;

  return (
    <Layer listening={false} name={EXPORT_HIDDEN_LAYER_NAME}>
      <Shape
        sceneFunc={(ctx) => {
          const g = gridSize;
          const startX = Math.floor(-panX / scale / g) * g - g;
          const startY = Math.floor(-panY / scale / g) * g - g;
          const endX = startX + width / scale + g * 2;
          const endY = startY + height / scale + g * 2;
          const isMajor = (v: number) => Math.abs(v % (g * 5)) < 0.5;

          const draw = (major: boolean, style: string, lineWidth: number) => {
            ctx.beginPath();
            for (let x = startX; x <= endX; x += g) {
              if (Math.abs(x) < 0.5 || isMajor(x) !== major) continue;
              ctx.moveTo(x, startY);
              ctx.lineTo(x, endY);
            }
            for (let y = startY; y <= endY; y += g) {
              if (Math.abs(y) < 0.5 || isMajor(y) !== major) continue;
              ctx.moveTo(startX, y);
              ctx.lineTo(endX, y);
            }
            ctx.strokeStyle = style;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          };

          draw(false, "#e2e3e8", 0.4 * px);
          draw(true, "#cfd0d6", 0.8 * px);

          ctx.beginPath();
          ctx.moveTo(0, startY);
          ctx.lineTo(0, endY);
          ctx.moveTo(startX, 0);
          ctx.lineTo(endX, 0);
          ctx.strokeStyle = "#a0a1a8";
          ctx.lineWidth = 1.5 * px;
          ctx.stroke();
        }}
        listening={false}
      />
    </Layer>
  );
});
