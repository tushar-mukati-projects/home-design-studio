import { getToken } from "@/lib/axios";
import { API_URL } from "@/lib/env";
import { parseErrorBody } from "@/lib/sse";

const SESSION_EXPIRED_MESSAGE = "Your session expired. Please sign in again.";
const EMPTY_RESPONSE_MESSAGE = "The server sent an empty response. Please try again.";
const REQUEST_FAILED_MESSAGE = "Sorry, something went wrong. Please try again.";

export const openSseStream = async (
  path: string,
  body: FormData | Record<string, unknown>,
  signal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> => {
  const token = await getToken();
  if (!token) throw new Error(SESSION_EXPIRED_MESSAGE);
  const authorization = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    signal,
    ...(body instanceof FormData
      ? { headers: authorization, body }
      : {
          headers: { ...authorization, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  if (res.status === 401) throw new Error(SESSION_EXPIRED_MESSAGE);
  if (!res.ok) throw new Error(parseErrorBody(await res.text()) ?? REQUEST_FAILED_MESSAGE);
  if (!res.body) throw new Error(EMPTY_RESPONSE_MESSAGE);
  return res.body;
};
