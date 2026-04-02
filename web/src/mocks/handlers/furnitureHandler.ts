import { http, HttpResponse, delay } from "msw";
import { _furnitureItems, _designs } from "../store";
import { mockUrl } from "../config";
import type { PlacedFurniture } from "@/types";

export const furnitureHandlers = [
  http.get(mockUrl("/furniture"), async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let results = _furnitureItems;
    if (category && category !== "all") {
      results = results.filter((f) => f.category === category);
    }

    return HttpResponse.json(results);
  }),

  http.post(mockUrl("/furniture/place"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as {
      designId: string;
      furnitureItemId: string;
      x: number;
      y: number;
      rotation?: number;
    };

    const design = _designs.find((d) => d.id === input.designId);
    if (!design) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const furnitureItem = _furnitureItems.find((f) => f.id === input.furnitureItemId);
    if (!furnitureItem) {
      return HttpResponse.json({ error: "Furniture item not found" }, { status: 404 });
    }

    const placement: PlacedFurniture = {
      id: `pf_${crypto.randomUUID().slice(0, 8)}`,
      furnitureItemId: input.furnitureItemId,
      furnitureItem,
      x: input.x,
      y: input.y,
      rotation: input.rotation ?? 0,
      scaleX: 1,
      scaleY: 1,
    };

    design.furniture.push(placement);
    design.updatedAt = new Date().toISOString();

    return HttpResponse.json(placement, { status: 201 });
  }),

  http.patch(mockUrl("/furniture/place/:id"), async ({ params, request }) => {
    await delay(200);
    const placementId = params.id as string;
    const updates = (await request.json()) as Partial<{
      x: number;
      y: number;
      rotation: number;
      scaleX: number;
      scaleY: number;
    }>;

    for (const design of _designs) {
      const placement = design.furniture.find((f) => f.id === placementId);
      if (placement) {
        if (updates.x !== undefined) placement.x = updates.x;
        if (updates.y !== undefined) placement.y = updates.y;
        if (updates.rotation !== undefined) placement.rotation = updates.rotation;
        if (updates.scaleX !== undefined) placement.scaleX = updates.scaleX;
        if (updates.scaleY !== undefined) placement.scaleY = updates.scaleY;
        design.updatedAt = new Date().toISOString();
        return HttpResponse.json(placement);
      }
    }

    return HttpResponse.json({ error: "Placement not found" }, { status: 404 });
  }),

  http.delete(mockUrl("/furniture/place/:id"), async ({ params }) => {
    await delay(200);
    const placementId = params.id as string;

    for (const design of _designs) {
      const idx = design.furniture.findIndex((f) => f.id === placementId);
      if (idx !== -1) {
        design.furniture.splice(idx, 1);
        design.updatedAt = new Date().toISOString();
        return HttpResponse.json({ success: true });
      }
    }

    return HttpResponse.json({ error: "Placement not found" }, { status: 404 });
  }),
];
