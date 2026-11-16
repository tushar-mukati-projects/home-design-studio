import { http, HttpResponse, delay } from "msw";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { DEMO_USER } from "../data/designs";

export const meHandlers = [
  http.get(mockUrl("/me"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json({
      ...DEMO_USER,
      plan: "pro",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }),
];
