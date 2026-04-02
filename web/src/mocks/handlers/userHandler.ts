import { http, HttpResponse, delay } from "msw";
import { _user } from "../store";
import { mockUrl } from "../config";

export const userHandlers = [
  http.get(mockUrl("/users/me"), async () => {
    await delay(200);
    return HttpResponse.json(_user);
  }),
];
