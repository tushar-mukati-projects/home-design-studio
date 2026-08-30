import { http, HttpResponse, delay } from "msw";
import { _designs, serializeMockDesign } from "../store";
import { mockUrl } from "../config";
import type { Design, CanvasData, Room, PlacedFurniture } from "@/types";

export const designHandlers = [
  http.get(mockUrl("/designs"), async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";

    let results = _designs;

    if (search) {
      results = results.filter(
        (d) =>
          d.name.toLowerCase().includes(search) || d.description?.toLowerCase().includes(search),
      );
    }

    return HttpResponse.json({ designs: results.map(serializeMockDesign) });
  }),

  http.get(mockUrl("/designs/:id"), async ({ params }) => {
    await delay(200);
    const design = _designs.find((d) => d.id === params.id);
    if (!design) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }
    return HttpResponse.json(serializeMockDesign(design));
  }),

  http.post(mockUrl("/designs"), async ({ request }) => {
    await delay(300);
    const input = (await request.json()) as {
      name: string;
      description?: string;
      width?: number;
      height?: number;
    };

    const now = new Date().toISOString();
    const design: Design = {
      id: `design_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      description: input.description ?? null,
      thumbnail: null,
      width: input.width ?? 800,
      height: input.height ?? 600,
      canvasData: {
        walls: [],
        doors: [],
        windows: [],
        gridSize: 25,
        zoom: 1,
        panX: 0,
        panY: 0,
      },
      rooms: [],
      furniture: [],
      createdAt: now,
      updatedAt: now,
    };

    _designs.push(design);
    return HttpResponse.json(design, { status: 201 });
  }),

  http.patch(mockUrl("/designs/:id"), async ({ params, request }) => {
    await delay(300);
    const idx = _designs.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }

    const updates = (await request.json()) as Partial<{
      name: string;
      description: string;
      width: number;
      height: number;
      canvasData: CanvasData;
      rooms: Room[];
      furniture: PlacedFurniture[];
    }>;

    const design = _designs[idx];
    if (updates.name !== undefined) design.name = updates.name;
    if (updates.description !== undefined) design.description = updates.description;
    if (updates.width !== undefined) design.width = updates.width;
    if (updates.height !== undefined) design.height = updates.height;
    if (updates.canvasData !== undefined) design.canvasData = updates.canvasData;
    if (updates.rooms !== undefined) design.rooms = updates.rooms;
    if (updates.furniture !== undefined) design.furniture = updates.furniture;
    design.updatedAt = new Date().toISOString();

    return HttpResponse.json(serializeMockDesign(design));
  }),

  http.delete(mockUrl("/designs/:id"), async ({ params }) => {
    await delay(200);
    const idx = _designs.findIndex((d) => d.id === params.id);
    if (idx === -1) {
      return HttpResponse.json({ error: "Design not found" }, { status: 404 });
    }
    _designs.splice(idx, 1);
    return HttpResponse.json({ success: true });
  }),
];
