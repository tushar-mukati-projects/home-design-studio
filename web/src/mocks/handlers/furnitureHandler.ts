import { http, HttpResponse, delay } from "msw";
import { _furnitureItems } from "../store";
import { mockUrl } from "../config";

export const furnitureHandlers = [
  http.get(mockUrl("/furniture"), async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    let results = _furnitureItems;
    if (category && category !== "all") {
      results = results.filter((f) => f.category === category);
    }

    return HttpResponse.json(results);
  }),
];
