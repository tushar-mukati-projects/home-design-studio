"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { Layer, Rect, Text, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM } from "@/lib/constants";
import { furnitureColor, furnitureName, furnitureSize, toVec } from "@/lib/canvas";
import { FurnitureShape } from "./furniture-shape";
import type Konva from "konva";

function textColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#1a1a2e";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1a2e" : "#f0f0f4";
}

export const FurnitureLayer = memo(function FurnitureLayer() {
  const furniture = useEditorStore((s) => s.furniture);
  const catalog = useEditorStore((s) => s.catalog);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const zoom = useEditorStore((s) => s.zoom);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const snapPoint = useEditorStore((s) => s.snapPoint);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);

  const px = 1 / (zoom * PX_PER_MM);
  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const setShapeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) shapeRefs.current.set(id, node);
    else shapeRefs.current.delete(id);
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedElementId ? shapeRefs.current.get(selectedElementId) : undefined;
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, furniture]);

  return (
    <Layer>
      {furniture.map((piece) => {
        const isSelected = selectedElementId === piece.id;
        const [w, d, h] = furnitureSize(piece, catalog);
        const color = furnitureColor(piece, catalog);
        const name = furnitureName(piece, catalog);
        const textColor = textColorFor(color);

        return (
          <Group
            key={piece.id}
            ref={(node) => setShapeRef(piece.id, node)}
            x={piece.at[0]}
            y={piece.at[1]}
            rotation={piece.rotation}
            draggable={canEdit && activeTool === "select"}
            onClick={() => activeTool === "select" && setSelectedElement(piece.id)}
            onTap={() => activeTool === "select" && setSelectedElement(piece.id)}
            onDragEnd={(e) => {
              const raw = { x: e.target.x(), y: e.target.y() };
              const pos = snapToGrid ? snapPoint(raw) : raw;
              updateFurniture(piece.id, { at: toVec(pos) });
              e.target.position(pos);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const raw = { x: node.x(), y: node.y() };
              const pos = snapToGrid ? snapPoint(raw) : raw;
              updateFurniture(piece.id, {
                at: toVec(pos),
                rotation: node.rotation(),
                size: [Math.round(w * node.scaleX()), Math.round(d * node.scaleY()), h],
              });
              node.scaleX(1);
              node.scaleY(1);
              node.position(pos);
            }}
          >
            <FurnitureShape furnitureId={piece.item} width={w} height={d} color={color} />
            <Rect
              width={w}
              height={d}
              offsetX={w / 2}
              offsetY={d / 2}
              stroke={isSelected ? "#3a3a4a" : "#8a8a9480"}
              strokeWidth={isSelected ? 2 * px : px}
              shadowColor={isSelected ? "#52525b" : undefined}
              shadowBlur={isSelected ? 10 * px : 0}
              shadowOpacity={isSelected ? 0.4 : 0}
              cornerRadius={40}
              listening={false}
            />
            <Rect
              width={w * 0.35}
              height={Math.max(30, 4 * px)}
              offsetX={(w * 0.35) / 2}
              offsetY={d / 2}
              fill="#52525b"
              cornerRadius={10}
              opacity={0.7}
              listening={false}
            />
            {w > 600 && d > 400 && (
              <Text
                width={w}
                height={d}
                offsetX={w / 2}
                offsetY={d / 2}
                text={name}
                fontSize={Math.min(110, w / 7, d / 4.5)}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill={textColor}
                shadowColor={textColor === "#f0f0f4" ? "#00000080" : "#ffffff60"}
                shadowBlur={20}
                shadowOffsetY={5}
                align="center"
                verticalAlign="middle"
                listening={false}
                wrap="word"
                padding={40}
              />
            )}
          </Group>
        );
      })}

      <Transformer
        ref={transformerRef}
        rotateEnabled
        enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
        borderStroke="#52525b"
        borderStrokeWidth={2}
        anchorFill="#52525b"
        anchorStroke="#ffffff"
        anchorSize={10}
        anchorCornerRadius={2}
        rotateAnchorOffset={25}
        rotationSnaps={snapToGrid ? [0, 45, 90, 135, 180, 225, 270, 315] : []}
        rotationSnapTolerance={snapToGrid ? 6 : 0}
        boundBoxFunc={(oldBox, newBox) =>
          newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
        }
      />
    </Layer>
  );
});
