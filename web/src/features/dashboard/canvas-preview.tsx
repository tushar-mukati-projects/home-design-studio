import { ROOM_USAGE_COLORS, boundsOf } from "@/lib/canvas";
import { DEFAULT_FURNITURE_SIZE } from "@/lib/constants";
import type { Canvas } from "@/shared/canvas";

type CanvasPreviewProps = {
  canvas: Pick<Canvas, "walls" | "rooms" | "furniture">;
};

const PADDING_MM = 300;
const MIN_WALL_STROKE_MM = 40;
const ROOM_STROKE_MM = 30;

const EmptyPreview = () => (
  <svg viewBox="0 0 400 300" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
    <rect width={400} height={300} className="fill-secondary" rx={4} />
    <rect
      x={80}
      y={60}
      width={240}
      height={180}
      fill="none"
      className="stroke-border"
      strokeWidth={2}
    />
    <line x1={200} y1={60} x2={200} y2={240} className="stroke-border" strokeDasharray="4 4" />
    <line x1={80} y1={150} x2={320} y2={150} className="stroke-border" strokeDasharray="4 4" />
  </svg>
);

export const CanvasPreview = ({ canvas }: CanvasPreviewProps) => {
  const bounds = boundsOf(canvas);
  if (!bounds) return <EmptyPreview />;

  const x = bounds.minX - PADDING_MM;
  const y = bounds.minY - PADDING_MM;
  const width = bounds.maxX - bounds.minX + PADDING_MM * 2;
  const height = bounds.maxY - bounds.minY + PADDING_MM * 2;

  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect x={x} y={y} width={width} height={height} className="fill-secondary" />
      {canvas.rooms.map((room) => (
        <polygon
          key={room.id}
          points={room.polygon.map((p) => p.join(",")).join(" ")}
          fill={ROOM_USAGE_COLORS[room.usage]}
          opacity={0.25}
          stroke={ROOM_USAGE_COLORS[room.usage]}
          strokeWidth={ROOM_STROKE_MM}
          strokeOpacity={0.5}
        />
      ))}
      {canvas.walls.map((wall) => (
        <line
          key={wall.id}
          x1={wall.from[0]}
          y1={wall.from[1]}
          x2={wall.to[0]}
          y2={wall.to[1]}
          stroke={wall.color ?? "var(--secondary-foreground)"}
          strokeWidth={Math.max(wall.thickness, MIN_WALL_STROKE_MM)}
          strokeLinecap="round"
        />
      ))}
      {canvas.furniture.map((piece) => {
        const [w, d] = piece.size ?? DEFAULT_FURNITURE_SIZE;
        return (
          <rect
            key={piece.id}
            x={piece.at[0] - w / 2}
            y={piece.at[1] - d / 2}
            width={w}
            height={d}
            rx={40}
            className="fill-muted-foreground"
            opacity={0.25}
            transform={`rotate(${piece.rotation} ${piece.at[0]} ${piece.at[1]})`}
          />
        );
      })}
    </svg>
  );
};
