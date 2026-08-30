"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { Layer, Rect, Text, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
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
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const zoom = useEditorStore((s) => s.zoom);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const snapPoint = useEditorStore((s) => s.snapPoint);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);

  const transformerRef = useRef<Konva.Transformer>(null);
  const shapeRefs = useRef<Map<string, Konva.Group>>(new Map());

  const setShapeRef = useCallback((id: string, node: Konva.Group | null) => {
    if (node) {
      shapeRefs.current.set(id, node);
    } else {
      shapeRefs.current.delete(id);
    }
  }, []);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedElementId) {
      const node = shapeRefs.current.get(selectedElementId);
      if (node) {
        transformer.nodes([node]);
        transformer.getLayer()?.batchDraw();
        return;
      }
    }

    transformer.nodes([]);
    transformer.getLayer()?.batchDraw();
  }, [selectedElementId, furniture]);

  return (
    <Layer>
      {furniture.map((piece) => {
        const isSelected = selectedElementId === piece.id;
        const fw = piece.furnitureItem.width;
        const fh = piece.furnitureItem.height;

        return (
          <Group
            key={piece.id}
            ref={(node) => setShapeRef(piece.id, node)}
            x={piece.x}
            y={piece.y}
            rotation={piece.rotation}
            scaleX={piece.scaleX}
            scaleY={piece.scaleY}
            draggable={canEdit && activeTool === "select"}
            onClick={() => {
              if (activeTool === "select") {
                setSelectedElement(piece.id);
              }
            }}
            onTap={() => {
              if (activeTool === "select") {
                setSelectedElement(piece.id);
              }
            }}
            onDragEnd={(e) => {
              const pos = snapToGrid
                ? snapPoint({ x: e.target.x(), y: e.target.y() })
                : { x: e.target.x(), y: e.target.y() };
              updateFurniture(piece.id, { x: pos.x, y: pos.y });
              e.target.position(pos);
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              const scX = node.scaleX();
              const scY = node.scaleY();
              const rot = node.rotation();
              const pos = snapToGrid
                ? snapPoint({ x: node.x(), y: node.y() })
                : { x: node.x(), y: node.y() };

              updateFurniture(piece.id, {
                x: pos.x,
                y: pos.y,
                rotation: rot,
                scaleX: scX,
                scaleY: scY,
              });
              node.position(pos);
            }}
          >
            <FurnitureShape
              furnitureId={piece.furnitureItem.icon ?? piece.furnitureItem.id}
              width={fw}
              height={fh}
              color={piece.furnitureItem.color || "#d4d4d8"}
            />
            <Rect
              width={fw}
              height={fh}
              offsetX={fw / 2}
              offsetY={fh / 2}
              stroke={isSelected ? "#3a3a4a" : "#8a8a9480"}
              strokeWidth={isSelected ? 2 / zoom : 1 / zoom}
              shadowColor={isSelected ? "#52525b" : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowOpacity={isSelected ? 0.4 : 0}
              cornerRadius={4}
              listening={false}
            />
            <Rect
              width={fw * 0.35}
              height={Math.max(3, 4 / zoom)}
              offsetX={(fw * 0.35) / 2}
              offsetY={fh / 2}
              fill="#52525b"
              cornerRadius={1}
              opacity={0.7}
              listening={false}
            />
            {fw > 60 && fh > 40 && (
              <Text
                width={fw}
                height={fh}
                offsetX={fw / 2}
                offsetY={fh / 2}
                text={piece.furnitureItem.name}
                fontSize={Math.min(11, fw / 7, fh / 4.5) / Math.max(piece.scaleX, 0.5)}
                fontFamily="Inter, sans-serif"
                fontStyle="600"
                fill={textColorFor(piece.furnitureItem.color || "#d4d4d8")}
                shadowColor={
                  textColorFor(piece.furnitureItem.color || "#d4d4d8") === "#f0f0f4"
                    ? "#00000080"
                    : "#ffffff60"
                }
                shadowBlur={2}
                shadowOffsetX={0}
                shadowOffsetY={0.5}
                align="center"
                verticalAlign="middle"
                listening={false}
                wrap="word"
                padding={4}
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
        boundBoxFunc={(oldBox, newBox) => {
          if (newBox.width < 10 || newBox.height < 10) {
            return oldBox;
          }
          return newBox;
        }}
      />
    </Layer>
  );
});
