export const INK = "var(--primary)";
export const MUTED_INK = "var(--muted-foreground)";

export const gridLines = (color: string, spacingPx: number) =>
  [0, 90]
    .map(
      (angle) =>
        `repeating-linear-gradient(${angle}deg, ${color} 0px, transparent 1px, transparent ${spacingPx}px)`,
    )
    .join(", ");
