"use client";

import { memo, useRef, useEffect, useCallback, useMemo } from "react";
import { Rect, Text, Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { furnitureSize, toVec } from "@/lib/canvas";
import { FurnitureShape } from "./furniture-shape";
import type { CatalogItem, Furniture } from "@/types";
import type Konva from "konva";

const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

function textColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return "#1a1a2e";
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1a1a2e" : "#f0f0f4";
}

interface FurnitureItemProps {
  piece: Furniture;
  item: CatalogItem | undefined;
  isSelected: boolean;
  draggable: boolean;
  register: (id: string, node: Konva.Group | null) => void;
}

const FurnitureItem = memo(function FurnitureItem({
  piece,
  item,
  isSelected,
  draggable,
  register,
}: FurnitureItemProps) {
  const [w, d, h] = piece.size ?? item?.size ?? [600, 600, 600];
  const color = piece.color ?? item?.color ?? "#d4d4d8";
  const name = item?.name ?? piece.item;

  const select = () => {
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(piece.id);
  };

  const settledPosition = (node: Konva.Node) => {
    const s = useEditorStore.getState();
    const raw = { x: node.x(), y: node.y() };
    return s.snapToGrid ? s.snapPoint(raw) : raw;
  };

  return (
    <Group
      ref={(node) => register(piece.id, node)}
      x={piece.at[0]}
      y={piece.at[1]}
      rotation={piece.rotation}
      draggable={draggable}
      onClick={select}
      onTap={select}
      onDragEnd={(e) => {
        const pos = settledPosition(e.target);
        useEditorStore.getState().updateFurniture(piece.id, { at: toVec(pos) });
        e.target.position(pos);
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const pos = settledPosition(node);
        useEditorStore.getState().updateFurniture(piece.id, {
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
        strokeWidth={isSelected ? 2 : 1}
        strokeScaleEnabled={false}
        cornerRadius={40}
        listening={false}
        {...flat}
      />
      <Rect
        width={w * 0.35}
        height={30}
        offsetX={(w * 0.35) / 2}
        offsetY={d / 2}
        fill="#52525b"
        cornerRadius={10}
        opacity={0.7}
        listening={false}
        {...flat}
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
          fill={textColorFor(color)}
          align="center"
          verticalAlign="middle"
          listening={false}
          wrap="word"
          padding={40}
          {...flat}
        />
      )}
    </Group>
  );
});

export const FurnitureShapes = memo(function FurnitureShapes() {
  const furniture = useEditorStore((s) => s.furniture);
  const catalog = useEditorStore((s) => s.catalog);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);

  const byId = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodes = useRef<Map<string, Konva.Group>>(new Map());

  const register = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const selectedIsFurniture =
    !!selectedElementId && furniture.some((f) => f.id === selectedElementId);
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node =
      selectedIsFurniture && selectedElementId ? nodes.current.get(selectedElementId) : undefined;
    transformer.nodes(node ? [node] : []);
  }, [selectedElementId, selectedIsFurniture]);

  return (
    <>
      {furniture.map((piece) => (
        <FurnitureItem
          key={piece.id}
          piece={piece}
          item={byId.get(piece.item)}
          isSelected={selectedElementId === piece.id}
          draggable={canEdit && activeTool === "select"}
          register={register}
        />
      ))}
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
    </>
  );
});

export { furnitureSize };
