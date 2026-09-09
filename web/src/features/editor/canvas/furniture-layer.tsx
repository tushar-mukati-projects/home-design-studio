"use client";

import { memo, useRef, useEffect, useCallback, useMemo } from "react";
import { Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM } from "@/lib/constants";
import { furnitureSize, toVec } from "@/lib/canvas";
import { FurnitureShape } from "./furniture-shape";
import { ACCENT, Chip } from "./wall-layer";
import { useHover } from "./hover";
import type { CatalogItem, Furniture } from "@/types";
import type Konva from "konva";

const FurnitureLabel = ({ name, rotation }: { name: string; rotation: number }) => {
  const zoom = useEditorStore((s) => s.zoom);
  return (
    <Group rotation={-rotation} listening={false}>
      <Chip x={0} y={0} px={1 / (zoom * PX_PER_MM)} text={name} strong />
    </Group>
  );
};

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
  const { hovered, ...hover } = useHover();
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
      onDragStart={select}
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
          rotation: Math.round(node.rotation()),
          size: [Math.round(w * node.scaleX()), Math.round(d * node.scaleY()), h],
        });
        node.scaleX(1);
        node.scaleY(1);
        node.position(pos);
      }}
      {...hover}
    >
      <FurnitureShape item={piece.item} width={w} depth={d} color={color} />
      {(hovered || isSelected) && <FurnitureLabel name={name} rotation={piece.rotation} />}
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
  const zoom = useEditorStore((s) => s.zoom);
  const anchorSize = Math.max(8, Math.min(12, 10 * Math.sqrt(zoom)));

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
        borderStroke={ACCENT}
        borderStrokeWidth={1.5}
        borderDash={[4, 3]}
        anchorFill="#ffffff"
        anchorStroke={ACCENT}
        anchorStrokeWidth={2}
        anchorSize={anchorSize}
        anchorCornerRadius={anchorSize / 2}
        rotateAnchorOffset={24}
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
