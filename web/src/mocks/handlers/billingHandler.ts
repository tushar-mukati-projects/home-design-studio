import { http, HttpResponse, delay } from "msw";
import type { Plan } from "@/types";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { DEMO_USER } from "../data/designs";
import { designs } from "../store";

const currentPlan = (): Plan => ({
  plan: "pro",
  canCreateDesign: true,
  canShare: true,
  canUseAI: true,
  designLimit: null,
  designCount: designs.filter((d) => d.userId === DEMO_USER.id).length,
  status: "active",
  currentPeriodEnd: "2026-11-20T00:00:00.000Z",
  cancelAtPeriodEnd: false,
});

export const billingHandlers = [
  http.get(mockUrl("/billing/plan"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json(currentPlan());
  }),

  http.post(mockUrl("/billing/checkout"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json({ url: "/dashboard?checkout=success" });
  }),

  http.post(mockUrl("/billing/portal"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json({ url: "/dashboard" });
  }),
];
