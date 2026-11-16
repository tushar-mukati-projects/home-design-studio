import { http, HttpResponse, delay } from "msw";
import { MOCK_DELAY_MS, mockUrl } from "../config";
import { furnitureItems } from "../store";

export const furnitureHandlers = [
  http.get(mockUrl("/furniture"), async () => {
    await delay(MOCK_DELAY_MS);
    return HttpResponse.json(furnitureItems);
  }),
];
