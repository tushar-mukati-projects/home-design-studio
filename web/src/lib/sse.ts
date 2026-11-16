import { z, type ZodType } from "zod";

export const SSE_DONE = "[DONE]";

const DATA_PREFIX = "data: ";
const UNREADABLE_MESSAGE = "The server sent a message we couldn't read.";

const errorBodySchema = z.object({ error: z.string().min(1) });

export type SseChunk = {
  payloads: string[];
  rest: string;
  done: boolean;
};

export const splitSseBuffer = (buffer: string): SseChunk => {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const payloads: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith(DATA_PREFIX)) continue;
    const payload = trimmed.slice(DATA_PREFIX.length).trim();
    if (payload === SSE_DONE) return { payloads, rest: "", done: true };
    payloads.push(payload);
  }
  return { payloads, rest, done: false };
};

export const parseSsePayload = <T>(payload: string, schema: ZodType<T>): T | null => {
  let json: unknown;
  try {
    json = JSON.parse(payload);
  } catch {
    throw new Error(UNREADABLE_MESSAGE);
  }
  const parsed = schema.safeParse(json);
  return parsed.success ? parsed.data : null;
};

export const readSseEvents = async function* <T>(
  body: ReadableStream<Uint8Array>,
  schema: ZodType<T>,
): AsyncGenerator<T> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      const chunk = splitSseBuffer(buffer + decoder.decode(value, { stream: true }));
      buffer = chunk.rest;
      for (const payload of chunk.payloads) {
        const event = parseSsePayload(payload, schema);
        if (event !== null) yield event;
      }
      if (chunk.done) return;
    }
  } finally {
    await reader.cancel();
  }
};

export const isAbortError = (err: unknown): boolean =>
  err instanceof Error && err.name === "AbortError";

export const parseErrorBody = (text: string): string | null => {
  try {
    const parsed = errorBodySchema.safeParse(JSON.parse(text));
    return parsed.success ? parsed.data.error : null;
  } catch {
    return null;
  }
};
