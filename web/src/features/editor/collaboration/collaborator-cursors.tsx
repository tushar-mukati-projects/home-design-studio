"use client";

import { useState, useEffect } from "react";
import { Layer, Group, Shape, Rect, Text } from "react-konva";
import type { CollaboratorCursor } from "@/stores/collaboration-store";
import { EXPORT_HIDDEN_LAYER_NAME, PX_PER_MM } from "@/lib/constants";
import { useEditorStore } from "@/stores/editor-store";

interface CollaboratorCursorsProps {
  collaborators: CollaboratorCursor[];
}

const CURSOR_FADE_MS = 5000;

export const CollaboratorCursors = ({ collaborators }: CollaboratorCursorsProps) => {
  const [now, setNow] = useState(() => Date.now());
  const zoom = useEditorStore((s) => s.zoom);
  // The stage is in millimetres; this keeps the cursor and label the same size on screen.
  const px = 1 / (zoom * PX_PER_MM);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <Layer listening={false} name={EXPORT_HIDDEN_LAYER_NAME}>
      {collaborators.map((c) => {
        const elapsed = now - c.lastSeen;
        const opacity = elapsed > CURSOR_FADE_MS ? 0.2 : 1;
        const displayName = c.name.split("-").join(" ");
        const labelW = displayName.length * 7 + 18;

        return (
          <Group key={c.id} x={c.x} y={c.y} opacity={opacity} scaleX={px} scaleY={px}>
            <Shape
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, 18);
                ctx.lineTo(5.4, 13.8);
                ctx.lineTo(9.6, 21.6);
                ctx.lineTo(12, 20.4);
                ctx.lineTo(7.8, 12.6);
                ctx.lineTo(13.2, 12.6);
                ctx.closePath();
                ctx.fillStrokeShape(shape);
              }}
              fill={c.color}
              stroke="#fff"
              strokeWidth={1.2}
            />
            <Rect x={13} y={17} width={labelW} height={20} fill={c.color} cornerRadius={4} />
            <Shape
              sceneFunc={(ctx, shape) => {
                ctx.beginPath();
                ctx.moveTo(13, 22);
                ctx.lineTo(17, 17);
                ctx.lineTo(21, 22);
                ctx.closePath();
                ctx.fillStrokeShape(shape);
              }}
              fill={c.color}
            />
            <Text
              x={13}
              y={20}
              width={labelW}
              height={14}
              text={displayName}
              fontSize={11}
              fontStyle="600"
              fill="#fff"
              align="center"
              fontFamily="system-ui, -apple-system, sans-serif"
            />
          </Group>
        );
      })}
    </Layer>
  );
};
