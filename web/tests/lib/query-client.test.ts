import { describe, test, expect, beforeEach, mock } from "bun:test";
import { AxiosError, AxiosHeaders } from "axios";

const errorToasts: string[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (msg: string) => errorToasts.push(msg),
    success: () => {},
  },
}));

const { makeQueryClient } = await import("@/lib/query-client");

const serverError = (status: number, message: string): AxiosError => {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    statusText: "",
    data: { error: message },
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return err;
};

const runFailingMutation = async (error: unknown, meta?: Record<string, unknown>) => {
  const client = makeQueryClient();
  const observerLess = client
    .getMutationCache()
    .build(client, { mutationFn: async () => Promise.reject(error), meta });
  await observerLess.execute(undefined).catch(() => undefined);
};

beforeEach(() => {
  errorToasts.length = 0;
});

describe("global mutation error handling", () => {
  test("a failed mutation always tells the user something", async () => {
    await runFailingMutation(serverError(403, "Pro plan required to share designs"));

    expect(errorToasts).toHaveLength(1);
    expect(errorToasts[0]).toBe("Pro plan required to share designs");
  });

  test("surfaces the real reason, not a generic string", async () => {
    await runFailingMutation(serverError(403, "Design limit reached"));
    expect(errorToasts[0]).toBe("Design limit reached");
  });

  test("still reports when the server sends no message", async () => {
    await runFailingMutation(serverError(503, ""));
    expect(errorToasts[0]).toContain("Try again");
  });

  test("a caller can opt out with meta.skipErrorToast", async () => {
    await runFailingMutation(serverError(400, "handled locally"), { skipErrorToast: true });
    expect(errorToasts).toHaveLength(0);
  });

  test("a successful mutation says nothing", async () => {
    const client = makeQueryClient();
    const m = client.getMutationCache().build(client, { mutationFn: async () => "ok" });
    await m.execute(undefined);
    expect(errorToasts).toHaveLength(0);
  });
});
