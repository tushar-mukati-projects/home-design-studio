"use client";

import { memo } from "react";
import { Group, Transformer } from "react-konva";
import { useEditorStore } from "@/stores/editor-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";
import { furnitureColor, furnitureName, furnitureSize, toVec } from "@/lib/canvas";
import { Chip } from "./chip";
import { FurnitureShape } from "./furniture-shape";
import { useHover } from "./hover";
import { HANDLE_FILL, SELECTION } from "./palette";
import { anchorSizeFor, useTransformerSelection } from "./use-transformer-selection";
import type { CatalogItem, Furniture } from "@/shared/canvas";
import type Konva from "konva";

const ROTATION_SNAPS_DEG = [0, 45, 90, 135, 180, 225, 270, 315];
const ROTATION_SNAP_TOLERANCE_DEG = 6;
const MIN_TRANSFORM_PX = 10;
const ROTATE_ANCHOR_OFFSET_PX = 24;
const BORDER_STROKE_PX = 1.5;
const BORDER_DASH_PX = [4, 3];
const ANCHOR_STROKE_PX = 2;
const CORNER_ANCHORS = ["top-left", "top-right", "bottom-left", "bottom-right"];

type FurnitureItemProps = {
  piece: Furniture;
  catalog: CatalogItem[];
  isSelected: boolean;
  draggable: boolean;
  register: (id: string, node: Konva.Group | null) => void;
};

type FurnitureLabelProps = {
  name: string;
  rotation: number;
};

const FurnitureLayer = () => {
  const furniture = useEditorStore((s) => s.furniture);
  const catalog = useEditorStore((s) => s.catalog);
  const activeTool = useEditorStore((s) => s.activeTool);
  const canEdit = useEditorStore((s) => s.canEdit);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const zoom = useEditorStore((s) => s.zoom);
  const anchorSize = anchorSizeFor(zoom);
  const { transformerRef, register } = useTransformerSelection(
    selectedElementId,
    (id) => furniture.some((f) => f.id === id),
    canEdit,
  );

  return (
    <>
      {furniture.map((piece) => (
        <FurnitureItem
          key={piece.id}
          piece={piece}
          catalog={catalog}
          isSelected={selectedElementId === piece.id}
          draggable={canEdit && activeTool === "select"}
          register={register}
        />
      ))}
      <Transformer
        ref={transformerRef}
        name={EXPORT_HIDDEN_LAYER_NAME}
        rotateEnabled
        enabledAnchors={CORNER_ANCHORS}
        borderStroke={SELECTION}
        borderStrokeWidth={BORDER_STROKE_PX}
        borderDash={BORDER_DASH_PX}
        anchorFill={HANDLE_FILL}
        anchorStroke={SELECTION}
        anchorStrokeWidth={ANCHOR_STROKE_PX}
        anchorSize={anchorSize}
        anchorCornerRadius={anchorSize / 2}
        rotateAnchorOffset={ROTATE_ANCHOR_OFFSET_PX}
        rotationSnaps={snapToGrid ? ROTATION_SNAPS_DEG : []}
        rotationSnapTolerance={snapToGrid ? ROTATION_SNAP_TOLERANCE_DEG : 0}
        boundBoxFunc={(oldBox, newBox) =>
          newBox.width < MIN_TRANSFORM_PX || newBox.height < MIN_TRANSFORM_PX ? oldBox : newBox
        }
      />
    </>
  );
};

const FurniturePiece = ({
  piece,
  catalog,
  isSelected,
  draggable,
  register,
}: FurnitureItemProps) => {
  const { hovered, ...hover } = useHover();
  const [w, d, h] = furnitureSize(piece, catalog);

  const select = () => {
    const s = useEditorStore.getState();
    if (s.activeTool === "select") s.setSelectedElement(piece.id);
  };

  const settledPosition = (node: Konva.Node) => {
    const s = useEditorStore.getState();
    const raw = { x: node.x(), y: node.y() };
    return s.snapToGrid ? s.snapPoint(raw) : raw;
  };

  const finishDrag = (node: Konva.Node) => {
    const pos = settledPosition(node);
    useEditorStore.getState().updateFurniture(piece.id, { at: toVec(pos) });
    node.position(pos);
  };

  const finishTransform = (node: Konva.Node) => {
    const pos = settledPosition(node);
    useEditorStore.getState().updateFurniture(piece.id, {
      at: toVec(pos),
      rotation: Math.round(node.rotation()),
      size: [Math.round(w * node.scaleX()), Math.round(d * node.scaleY()), h],
    });
    node.scaleX(1);
    node.scaleY(1);
    node.position(pos);
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
      onDragEnd={(e) => finishDrag(e.target)}
      onTransformEnd={(e) => finishTransform(e.target)}
      {...hover}
    >
      <FurnitureShape
        item={piece.item}
        width={w}
        depth={d}
        color={furnitureColor(piece, catalog)}
      />
      {(hovered || isSelected) && (
        <FurnitureLabel name={furnitureName(piece, catalog)} rotation={piece.rotation} />
      )}
    </Group>
  );
};

const FurnitureLabel = ({ name, rotation }: FurnitureLabelProps) => {
  const zoom = useEditorStore((s) => s.zoom);
  return (
    <Group rotation={-rotation} listening={false}>
      <Chip x={0} y={0} px={1 / (zoom * PX_PER_MM)} text={name} />
    </Group>
  );
};

const FurnitureItem = memo(FurniturePiece);

export const FurnitureShapes = memo(FurnitureLayer);
