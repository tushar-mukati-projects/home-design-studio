import { http, HttpResponse, delay } from "msw";
import type { SharePermission } from "@/shared/canvas";
import type { DesignAccess, DesignLink, DesignMember } from "@/types";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { links, members } from "../store";

const LINK_CODE_LENGTH = 10;

type DesignParams = { id: string };
type AddMemberBody = { email: string; permission: SharePermission };
type CreateLinkBody = { permission: SharePermission };

export const accessHandlers = [
  http.get<DesignParams>(mockUrl("/designs/:id/access"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const body: DesignAccess = {
      members: members.filter((m) => m.designId === params.id),
      links: links.filter((l) => l.designId === params.id),
    };
    return HttpResponse.json(body);
  }),

  http.post<DesignParams, AddMemberBody>(
    mockUrl("/designs/:id/members"),
    async ({ params, request }) => {
      await delay(MOCK_DELAY_MS);
      const input = await request.json();
      const member: DesignMember = {
        id: crypto.randomUUID(),
        designId: params.id,
        email: input.email,
        permission: input.permission,
        createdAt: new Date().toISOString(),
      };
      members.push(member);
      return HttpResponse.json(member, { status: 201 });
    },
  ),

  http.delete(mockUrl("/designs/:id/members/:memberId"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = members.findIndex((m) => m.id === params.memberId);
    if (index === -1) return HttpResponse.json({ error: "Member not found" }, { status: 404 });
    members.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),

  http.post<DesignParams, CreateLinkBody>(
    mockUrl("/designs/:id/links"),
    async ({ params, request }) => {
      await delay(MOCK_DELAY_MS);
      const input = await request.json();
      const link: DesignLink = {
        id: crypto.randomUUID(),
        designId: params.id,
        code: crypto.randomUUID().replaceAll("-", "").slice(0, LINK_CODE_LENGTH),
        permission: input.permission,
        expiresAt: null,
        createdAt: new Date().toISOString(),
      };
      links.push(link);
      return HttpResponse.json(link, { status: 201 });
    },
  ),

  http.delete(mockUrl("/designs/:id/links/:linkId"), async ({ params }) => {
    await delay(MOCK_DELAY_MS);
    const index = links.findIndex((l) => l.id === params.linkId);
    if (index === -1) return HttpResponse.json({ error: "Link not found" }, { status: 404 });
    links.splice(index, 1);
    return HttpResponse.json({ success: true });
  }),
];
