"use client";

import { memo } from "react";
import { Layer, Shape } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME } from "@/lib/constants";

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

  return (
    <Layer listening={false} name={EXPORT_HIDDEN_LAYER_NAME}>
      <Shape
        sceneFunc={(ctx) => {
          const effectiveGrid = gridSize;
          const startX = Math.floor(-panX / zoom / effectiveGrid) * effectiveGrid - effectiveGrid;
          const startY = Math.floor(-panY / zoom / effectiveGrid) * effectiveGrid - effectiveGrid;
          const endX = startX + width / zoom + effectiveGrid * 2;
          const endY = startY + height / zoom + effectiveGrid * 2;

          ctx.beginPath();
          for (let x = startX; x <= endX; x += effectiveGrid) {
            if (Math.abs(x) < 0.5 || Math.abs(x % (effectiveGrid * 5)) < 0.5) continue;
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
          }
          for (let y = startY; y <= endY; y += effectiveGrid) {
            if (Math.abs(y) < 0.5 || Math.abs(y % (effectiveGrid * 5)) < 0.5) continue;
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
          }
          ctx.strokeStyle = "#e2e3e8";
          ctx.lineWidth = 0.4 / zoom;
          ctx.stroke();

          ctx.beginPath();
          for (let x = startX; x <= endX; x += effectiveGrid) {
            if (Math.abs(x % (effectiveGrid * 5)) < 0.5 && Math.abs(x) >= 0.5) {
              ctx.moveTo(x, startY);
              ctx.lineTo(x, endY);
            }
          }
          for (let y = startY; y <= endY; y += effectiveGrid) {
            if (Math.abs(y % (effectiveGrid * 5)) < 0.5 && Math.abs(y) >= 0.5) {
              ctx.moveTo(startX, y);
              ctx.lineTo(endX, y);
            }
          }
          ctx.strokeStyle = "#cfd0d6";
          ctx.lineWidth = 0.8 / zoom;
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(0, startY);
          ctx.lineTo(0, endY);
          ctx.moveTo(startX, 0);
          ctx.lineTo(endX, 0);
          ctx.strokeStyle = "#a0a1a8";
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();
        }}
        listening={false}
      />
    </Layer>
  );
});
