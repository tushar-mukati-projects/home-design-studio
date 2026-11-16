import { describe, test, expect } from "bun:test";
import { runEventStream, type EventStream } from "@/lib/sse";

const FAIL_MESSAGE = "Something broke";
const DONE = "data: [DONE]\n\n";

const fakeResponse = () => {
  const res = {
    req: { path: "/design-chat" },
    chunks: [] as string[],
    headers: {} as Record<string, string>,
    flushedBeforeWrite: false,
    closeListeners: [] as (() => void)[],
    writableEnded: false,
    setHeader: (name: string, value: string) => {
      res.headers[name] = value;
    },
    flushHeaders: () => {
      res.flushedBeforeWrite = res.chunks.length === 0;
    },
    write: (chunk: string) => {
      res.chunks.push(chunk);
      return true;
    },
    end: () => {
      res.writableEnded = true;
    },
    on: (_event: string, listener: () => void) => {
      res.closeListeners.push(listener);
    },
  };
  return res;
};

const run = (res: ReturnType<typeof fakeResponse>, body: (stream: EventStream) => Promise<void>) =>
  runEventStream(res as never, () => FAIL_MESSAGE, body);

describe("runEventStream", () => {
  test("sets the event-stream headers, flushes them first and ends with [DONE]", async () => {
    const res = fakeResponse();
    await run(res, async () => {});
    expect(res.headers).toEqual({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    expect(res.flushedBeforeWrite).toBe(true);
    expect(res.chunks).toEqual([DONE]);
    expect(res.writableEnded).toBe(true);
  });

  test.each([
    ["status", { message: "Working" }, 'data: {"type":"status","message":"Working"}\n\n'],
    ["tool_done", { name: "fetch_canvas" }, 'data: {"type":"tool_done","name":"fetch_canvas"}\n\n'],
    [
      "action",
      { actionType: "clear_design", payload: {} },
      'data: {"type":"action","actionType":"clear_design","payload":{}}\n\n',
    ],
    ["text", {}, 'data: {"type":"text"}\n\n'],
  ])("frames a %s event as one data line with the type first", async (event, data, frame) => {
    const res = fakeResponse();
    await run(res, async (stream) => stream.send(event, data));
    expect(res.chunks).toEqual([frame, DONE]);
  });

  test("a failure sends the error event before [DONE]", async () => {
    const res = fakeResponse();
    await run(res, async () => {
      throw new Error("model timeout");
    });
    expect(res.chunks).toEqual([`data: {"type":"error","message":"${FAIL_MESSAGE}"}\n\n`, DONE]);
  });

  test("a failure after the client left sends no error event", async () => {
    const res = fakeResponse();
    await run(res, async (stream) => {
      for (const listener of res.closeListeners) listener();
      expect(stream.signal.aborted).toBe(true);
      throw new Error("aborted");
    });
    expect(res.chunks).toEqual([DONE]);
  });

  test("nothing is written once the response has ended", async () => {
    const res = fakeResponse();
    await run(res, async (stream) => {
      res.writableEnded = true;
      stream.send("text", { content: "late" });
    });
    expect(res.chunks).toEqual([]);
  });
});
