import { useCallback, useEffect, useRef } from "react";
import type Konva from "konva";

const ANCHOR_MIN_PX = 8;
const ANCHOR_MAX_PX = 12;
const ANCHOR_BASE_PX = 10;

export const useTransformerSelection = (
  selectedId: string | null,
  owns: (id: string) => boolean,
  enabled: boolean,
) => {
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodes = useRef<Map<string, Konva.Group>>(new Map());

  const register = useCallback((id: string, node: Konva.Group | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);

  const attached = enabled && selectedId !== null && owns(selectedId) ? selectedId : null;
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = attached ? nodes.current.get(attached) : undefined;
    transformer.nodes(node ? [node] : []);
  }, [attached]);

  return { transformerRef, register };
};

export const anchorSizeFor = (zoom: number): number =>
  Math.max(ANCHOR_MIN_PX, Math.min(ANCHOR_MAX_PX, ANCHOR_BASE_PX * Math.sqrt(zoom)));
