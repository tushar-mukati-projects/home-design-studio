import { polygonArea, wallLength, type CatalogItem, type Wall } from "../../shared/canvas";
import type { ChatSession } from "./tools";

export const describeCanvas = ({ canvas, catalog }: ChatSession, designName: string): string => {
  const catalogText = catalog
    .map((c) => `${c.id} → ${c.name} (${c.size[0]}×${c.size[1]} mm, ${c.category})`)
    .join("\n");
  if (canvas.walls.length === 0 && canvas.rooms.length === 0 && canvas.furniture.length === 0) {
    return `Design "${designName}" is empty. Ready to build.\n\nFurniture catalog (use the exact id):\n${catalogText}`;
  }
  const extent = bounds(canvas.walls);
  const size = extent ? `${extent.width}×${extent.height} mm` : "empty";
  return [
    `Design "${designName}" (${size})`,
    `Walls: ${canvas.walls.length} (indexed 0–${canvas.walls.length - 1})`,
    `Rooms: ${canvas.rooms.map((r) => `"${r.name}" [${r.usage}]`).join(", ") || "none"}`,
    `Furniture: ${canvas.furniture.map((f) => itemName(catalog, f.item)).join(", ") || "none"}`,
    `Openings: ${canvas.openings.filter((o) => o.kind === "door").length} doors, ${canvas.openings.filter((o) => o.kind === "window").length} windows`,
    `\nFurniture catalog (use the exact id):\n${catalogText}`,
  ].join("\n");
};

export const reviewCanvas = ({ canvas, catalog }: ChatSession): string => {
  const { walls, rooms, furniture, openings } = canvas;
  if (walls.length === 0 && rooms.length === 0 && furniture.length === 0) return "Canvas is empty.";
  const parts = [
    walls.length &&
      `Walls (${walls.length}):\n` +
        walls
          .map((w, i) => `  [${i}] (${w.from})→(${w.to}) len=${wallLength(w)} id=${w.id}`)
          .join("\n"),
    rooms.length &&
      `Rooms (${rooms.length}):\n` +
        rooms
          .map(
            (r) =>
              `  "${r.name}" [${r.usage}] area=${Math.round(polygonArea(r.polygon) / 1e6)} m² id=${r.id}`,
          )
          .join("\n"),
    furniture.length &&
      `Furniture (${furniture.length}):\n` +
        furniture
          .map((f) => `  ${itemName(catalog, f.item)} at (${f.at}) rot=${f.rotation} id=${f.id}`)
          .join("\n"),
    openings.length &&
      `Openings (${openings.length}): ` +
        openings.map((o) => `${o.kind} on ${o.wall} @${o.offset}mm id=${o.id}`).join(", "),
  ].filter(Boolean);
  return parts.join("\n");
};

const itemName = (catalog: CatalogItem[], id: string) =>
  catalog.find((c) => c.id === id)?.name ?? id;

const bounds = (walls: Wall[]) => {
  if (walls.length === 0) return null;
  const xs = walls.flatMap((w) => [w.from[0], w.to[0]]);
  const ys = walls.flatMap((w) => [w.from[1], w.to[1]]);
  return { width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
};
