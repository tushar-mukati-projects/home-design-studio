import { describe, test, expect } from "bun:test";
import { z } from "zod";
import { parseErrorBody, parseSsePayload, readSseEvents, splitSseBuffer } from "@/lib/sse";

const eventSchema = z.object({ type: z.literal("text"), content: z.string() });

const stream = (...chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });

const collect = async (body: ReadableStream<Uint8Array>) => {
  const out: string[] = [];
  for await (const event of readSseEvents(body, eventSchema)) out.push(event.content);
  return out;
};

describe("splitSseBuffer", () => {
  test.each([
    ["", { payloads: [], rest: "", done: false }],
    ['data: {"a":1}\n\n', { payloads: ['{"a":1}'], rest: "", done: false }],
    ['data: {"a":1}\n\ndata: {"b"', { payloads: ['{"a":1}'], rest: 'data: {"b"', done: false }],
    [": comment\nevent: x\ndata: 1\n", { payloads: ["1"], rest: "", done: false }],
    ["data: 1\n\ndata: [DONE]\n\ndata: 2\n\n", { payloads: ["1"], rest: "", done: true }],
    ["data: 1\r\n\r\n", { payloads: ["1"], rest: "", done: false }],
  ])("splits %j", (buffer, expected) => {
    expect(splitSseBuffer(buffer)).toEqual(expected);
  });
});

describe("parseSsePayload", () => {
  test("returns the typed event", () => {
    expect(parseSsePayload('{"type":"text","content":"hi"}', eventSchema)).toEqual({
      type: "text",
      content: "hi",
    });
  });

  test("throws on malformed JSON and skips a schema mismatch", () => {
    expect(() => parseSsePayload("{not json", eventSchema)).toThrow("couldn't read");
    expect(parseSsePayload('{"type":"other"}', eventSchema)).toBeNull();
  });
});

describe("readSseEvents", () => {
  test("yields events across chunk boundaries and stops at [DONE]", async () => {
    const body = stream(
      'data: {"type":"text","content":"a"}\n\ndata: {"type":"te',
      'xt","content":"b"}\n\ndata: [DONE]\n\ndata: {"type":"text","content":"c"}\n\n',
    );
    expect(await collect(body)).toEqual(["a", "b"]);
  });

  test("skips an event it does not know and keeps reading", async () => {
    const body = stream('data: {"type":"other"}\n\ndata: {"type":"text","content":"a"}\n\n');
    expect(await collect(body)).toEqual(["a"]);
  });

  test("cancels the stream when it stops at [DONE]", async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
      },
      cancel() {
        cancelled = true;
      },
    });
    await collect(body);
    expect(cancelled).toBe(true);
  });

  test("a stream that closes without [DONE] still ends", async () => {
    expect(await collect(stream('data: {"type":"text","content":"a"}\n'))).toEqual(["a"]);
  });
});

describe("parseErrorBody", () => {
  test.each([
    ['{"error":"Too many requests"}', "Too many requests"],
    ['{"error":""}', null],
    ['{"message":"x"}', null],
    ["<html>Bad gateway</html>", null],
    ["", null],
  ])("reads %j as %p", (text, expected) => {
    expect(parseErrorBody(text)).toBe(expected);
  });
});
