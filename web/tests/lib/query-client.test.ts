import { describe, test, expect, beforeEach, mock } from "bun:test";
import { AxiosError, AxiosHeaders } from "axios";

const errorToasts: string[] = [];
mock.module("sonner", () => ({
  toast: {
    error: (msg: string) => errorToasts.push(msg),
    success: () => {},
  },
}));

const { makeQueryClient, shouldRetryQuery } = await import("@/lib/query-client");

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

const runFailingMutation = async (error: unknown) => {
  const client = makeQueryClient();
  const observerLess = client
    .getMutationCache()
    .build(client, { mutationFn: async () => Promise.reject(error) });
  await observerLess.execute(undefined).catch(() => undefined);
};

beforeEach(() => {
  errorToasts.length = 0;
});

describe("shouldRetryQuery", () => {
  test.each([
    ["first failure of a 500", 0, serverError(500, "boom"), true],
    ["first failure of a 503", 0, serverError(503, ""), true],
    ["first failure with no response", 0, new AxiosError("Network Error"), true],
    ["second failure of a 500", 1, serverError(500, "boom"), false],
    ["a plain error", 0, new Error("weird"), false],
    ["a 400", 0, serverError(400, "Invalid design"), false],
    ["a 401", 0, serverError(401, ""), false],
    ["a 403", 0, serverError(403, "Pro plan required"), false],
    ["a 404", 0, serverError(404, ""), false],
    ["a 409", 0, serverError(409, ""), false],
    ["a 422", 0, serverError(422, ""), false],
    ["a 429", 0, serverError(429, ""), false],
  ])("%s", (_label, failureCount, error, expected) => {
    expect(shouldRetryQuery(failureCount, error)).toBe(expected);
  });

  test("the query client uses it as the default retry", () => {
    expect(makeQueryClient().getDefaultOptions().queries?.retry).toBe(shouldRetryQuery);
  });

  test("mutations never retry", () => {
    expect(makeQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
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

  test("a successful mutation says nothing", async () => {
    const client = makeQueryClient();
    const m = client.getMutationCache().build(client, { mutationFn: async () => "ok" });
    await m.execute(undefined);
    expect(errorToasts).toHaveLength(0);
  });
});
