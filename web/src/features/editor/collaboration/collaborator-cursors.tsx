"use client";

import { memo, useState, useEffect } from "react";
import { Group, Shape, Rect, Text } from "react-konva";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { useEditorStore } from "@/stores/editor-store";
import { PX_PER_MM } from "@/lib/constants";

const CURSOR_FADE_MS = 5000;
const flat = { perfectDrawEnabled: false, shadowForStrokeEnabled: false } as const;

export const CollaboratorCursors = memo(function CollaboratorCursors() {
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const zoom = useEditorStore((s) => s.zoom);
  const px = 1 / (zoom * PX_PER_MM);

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (collaborators.length === 0) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [collaborators.length]);

  return (
    <>
      {collaborators.map((c) => {
        const faded = now - c.lastSeen > CURSOR_FADE_MS;
        const displayName = c.name.split("-").join(" ");
        const labelW = displayName.length * 7 + 18;

        return (
          <Group
            key={c.id}
            x={c.x}
            y={c.y}
            opacity={faded ? 0.25 : 1}
            scaleX={px}
            scaleY={px}
            listening={false}
          >
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
              {...flat}
            />
            <Rect
              x={13}
              y={17}
              width={labelW}
              height={20}
              fill={c.color}
              cornerRadius={4}
              {...flat}
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
    </>
  );
});
