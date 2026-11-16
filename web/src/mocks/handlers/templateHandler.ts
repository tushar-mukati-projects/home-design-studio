import { http, HttpResponse, delay } from "msw";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { templates } from "../store";

export const templateHandlers = [
  http.get(mockUrl("/templates"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json(templates);
  }),
];
