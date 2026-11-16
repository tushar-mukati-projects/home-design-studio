import { http, HttpResponse, delay, type PathParams } from "msw";
import type { CreateDesignPayload } from "@/hooks/designs/useCreateDesign";
import { emptyCanvas, type Canvas } from "@/shared/canvas";
import type { Design, DesignListResponse } from "@/types";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { DEMO_USER, mockDesign } from "../data/designs";
import { designs, detailOf, links, listItemOf, templates } from "../store";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

type UpdateDesignBody = Partial<{ name: string; description: string; canvasData: Canvas }>;

const inScope = (design: Design, scope: string): boolean =>
  scope === "all" || (scope === "shared") !== (design.userId === DEMO_USER.id);

const matches = (design: Design, search: string): boolean =>
  !search ||
  design.name.toLowerCase().includes(search) ||
  (design.description?.toLowerCase().includes(search) ?? false);

const sourceCanvas = (input: CreateDesignPayload): Canvas => {
  const source = input.templateId
    ? templates.find((t) => t.id === input.templateId)
    : designs.find((d) => d.id === input.duplicateOf);
  return structuredClone(source?.canvasData ?? emptyCanvas());
};

const notFound = () => HttpResponse.json({ error: "Design not found" }, { status: 404 });

export const designHandlers = [
  http.get(mockUrl("/designs"), async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const params = new URL(request.url).searchParams;
    const scope = params.get("scope") ?? "owned";
    const search = params.get("search")?.toLowerCase() ?? "";
    const limit = Math.min(Number(params.get("limit") ?? DEFAULT_LIMIT), MAX_LIMIT);
    const offset = Number(params.get("offset") ?? 0);
    const matched = designs
      .filter((d) => inScope(d, scope) && matches(d, search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const body: DesignListResponse = {
      designs: matched.slice(offset, offset + limit).map(listItemOf),
      total: matched.length,
      limit,
      offset,
    };
    return HttpResponse.json(body);
  }),

  http.get(mockUrl("/designs/:id"), async ({ params, request }) => {
    await delay(MOCK_DELAY_MS);
    const code = new URL(request.url).searchParams.get("code");
    const design = designs.find((d) => d.id === params.id);
    if (!design) return notFound();
    if (!code) return HttpResponse.json(detailOf(design));
    const link = links.find((l) => l.code === code && l.designId === design.id);
    if (!link) return HttpResponse.json({ error: "Share link is invalid" }, { status: 404 });
    return HttpResponse.json({ ...detailOf(design), permission: link.permission });
  }),

  http.post<PathParams, CreateDesignPayload>(mockUrl("/designs"), async ({ request }) => {
    await delay(MOCK_DELAY_MS);
    const input = await request.json();
    const now = new Date().toISOString();
    const design = mockDesign({
      id: crypto.randomUUID(),
      name: input.name,
      description: input.description ?? null,
      userId: DEMO_USER.id,
      canvasData: sourceCanvas(input),
      createdAt: now,
      updatedAt: now,
    });
    designs.push(design);
    return HttpResponse.json(detailOf(design), { status: 201 });
  }),

  http.patch<{ id: string }, UpdateDesignBody>(
    mockUrl("/designs/:id"),
    async ({ params, request }) => {
      await delay(MOCK_DELAY_MS);
      const design = designs.find((d) => d.id === params.id);
      if (!design) return notFound();
      const updates = await request.json();
      if (updates.name !== undefined) design.name = updates.name;
      if (updates.description !== undefined) design.description = updates.description;
      if (updates.canvasData !== undefined) design.canvasData = updates.canvasData;
      design.updatedAt = new Date().toISOString();
      return HttpResponse.json(detailOf(design));
    },
  ),

  http.delete(mockUrl("/designs/:id"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = designs.findIndex((d) => d.id === params.id);
    if (index === -1) return notFound();
    designs.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];
