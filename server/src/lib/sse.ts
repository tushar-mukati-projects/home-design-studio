import { errorMessage } from "./http-error";
import { logger } from "./logger";
import type { Response } from "express";

type EventData = Record<string, unknown>;

export type EventStream = {
  send: (event: string, data: EventData) => void;
  signal: AbortSignal;
};

export const runEventStream = async (
  res: Response,
  failMessage: (error: unknown) => string,
  run: (stream: EventStream) => Promise<void>,
): Promise<void> => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const disconnect = new AbortController();
  res.on("close", () => disconnect.abort());

  const stream: EventStream = {
    send: (event, data) => {
      if (res.writableEnded) return;
      res.write(`data: ${JSON.stringify({ type: event, ...data })}\n\n`);
    },
    signal: disconnect.signal,
  };

  try {
    await run(stream);
  } catch (error) {
    if (!stream.signal.aborted) {
      logger.error("Event stream failed", { path: res.req.path, error: errorMessage(error) });
      stream.send("error", { message: failMessage(error) });
    }
  }

  if (res.writableEnded) return;
  res.write("data: [DONE]\n\n");
  res.end();
};
