import { http, HttpResponse, delay } from "msw";
import { _designs, serializeMockDesign } from "../store";
import { mockUrl } from "../config";
import type { Design, Canvas } from "@/types";
import { emptyCanvas } from "@/lib/canvas";

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
    const input = (await request.json()) as { name: string; description?: string };

    const now = new Date().toISOString();
    const design: Design = {
      id: `design_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      description: input.description ?? null,
      thumbnail: null,
      canvasData: emptyCanvas(),
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
      canvasData: Canvas;
    }>;

    const design = _designs[idx];
    if (updates.name !== undefined) design.name = updates.name;
    if (updates.description !== undefined) design.description = updates.description;
    if (updates.canvasData !== undefined) design.canvasData = updates.canvasData;
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
