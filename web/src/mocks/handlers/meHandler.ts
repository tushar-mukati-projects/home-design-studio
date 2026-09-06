import { http, HttpResponse, delay } from "msw";
import { mockUrl } from "../config";

export const meHandlers = [
  http.get(mockUrl("/me"), async () => {
    await delay(200);
    return HttpResponse.json({
      id: "11111111-1111-4111-8111-111111111111",
      email: "demo@example.com",
      name: "Demo User",
      plan: "pro",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  }),
];
