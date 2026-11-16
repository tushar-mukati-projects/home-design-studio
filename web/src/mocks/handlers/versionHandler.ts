import { http, HttpResponse, delay } from "msw";
import type { DesignVersion } from "@/types";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { DEMO_USER } from "../data/designs";
import { designs, detailOf, versions } from "../store";

type CreateVersionBody = { name?: string };

export const versionHandlers = [
  http.get(mockUrl("/designs/:id/versions"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json(versions.filter((v) => v.designId === params.id));
  }),

  http.post<{ id: string }, CreateVersionBody>(
    mockUrl("/designs/:id/versions"),
    async ({ params, request }) => {
      await delay(MOCK_DELAY_MS);
      const design = designs.find((d) => d.id === params.id);
      if (!design) return HttpResponse.json({ error: "Design not found" }, { status: 404 });
      const input = await request.json();
      const version: DesignVersion = {
        id: crypto.randomUUID(),
        name:
          input.name ?? `Version ${versions.filter((v) => v.designId === design.id).length + 1}`,
        canvasData: structuredClone(design.canvasData),
        designId: design.id,
        createdById: DEMO_USER.id,
        createdAt: new Date().toISOString(),
      };
      versions.unshift(version);
      return HttpResponse.json(version, { status: 201 });
    },
  ),

  http.post(mockUrl("/designs/:id/versions/:versionId/restore"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const design = designs.find((d) => d.id === params.id);
    const version = versions.find((v) => v.id === params.versionId);
    if (!design || !version) {
      return HttpResponse.json({ error: "Design or version not found" }, { status: 404 });
    }
    design.canvasData = structuredClone(version.canvasData);
    design.updatedAt = new Date().toISOString();
    return HttpResponse.json(detailOf(design));
  }),

  http.delete(mockUrl("/designs/:id/versions/:versionId"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = versions.findIndex((v) => v.id === params.versionId);
    if (index === -1) return HttpResponse.json({ error: "Version not found" }, { status: 404 });
    versions.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];
