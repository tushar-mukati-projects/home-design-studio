"use client";

import { memo, useRef, useEffect, useCallback } from "react";
import { Layer, Rect, Text, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import type Konva from "konva";

export const FurnitureLayer = memo(function FurnitureLayer() {
  const furniture = useEditorStore((s) => s.furniture);
  const activeTool = useEditorStore((s) => s.activeTool);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const zoom = useEditorStore((s) => s.zoom);
  const updateFurniture = useEditorStore((s) => s.updateFurniture);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const snapPoint = useEditorStore((s) => s.snapPoint);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const gridSize = useEditorStore((s) => s.gridSize);

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
            draggable={activeTool === "select"}
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
            }}
          >
            <Rect
              width={fw}
              height={fh}
              offsetX={fw / 2}
              offsetY={fh / 2}
              fill={piece.furnitureItem.color || "#5A4E42"}
              cornerRadius={4}
              stroke={isSelected ? "#D4A853" : "#3A3530"}
              strokeWidth={isSelected ? 2 / zoom : 1 / zoom}
              shadowColor={isSelected ? "#D4A853" : undefined}
              shadowBlur={isSelected ? 10 : 0}
              shadowOpacity={isSelected ? 0.4 : 0}
            />
            <Text
              width={fw}
              height={fh}
              offsetX={fw / 2}
              offsetY={fh / 2}
              text={piece.furnitureItem.name}
              fontSize={Math.min(12, fw / 6, fh / 4) / Math.max(piece.scaleX, 0.5)}
              fontFamily="Figtree, sans-serif"
              fill="#F5F0EB"
              align="center"
              verticalAlign="middle"
              listening={false}
              wrap="word"
              padding={4}
            />
          </Group>
        );
      })}

      <Transformer
        ref={transformerRef}
        rotateEnabled
        enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]}
        borderStroke="#D4A853"
        borderStrokeWidth={2}
        anchorFill="#D4A853"
        anchorStroke="#0C0C0C"
        anchorSize={10}
        anchorCornerRadius={2}
        rotateAnchorOffset={25}
        rotationSnaps={snapToGrid ? [0, 45, 90, 135, 180, 225, 270, 315] : []}
        rotationSnapTolerance={snapToGrid ? gridSize / 2 : 0}
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
