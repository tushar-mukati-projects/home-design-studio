import { describe, test, expect } from "bun:test";
import { rateLimit } from "@/middleware/rate-limit";

const makeRes = () => {
  const headers: Record<string, string> = {};
  let statusCode = 0;
  let body: unknown = null;
  return {
    headers,
    get statusCode() {
      return statusCode;
    },
    get body() {
      return body;
    },
    setHeader: (k: string, v: string) => {
      headers[k] = v;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };
};

const call = (limiter: ReturnType<typeof rateLimit>, userId: string) => {
  const req = { auth: { userId }, ip: "1.1.1.1" } as never;
  const res = makeRes();
  let passed = false;
  limiter(req, res as never, () => {
    passed = true;
  });
  return { passed, res };
};

describe("rateLimit", () => {
  test("allows requests up to the limit", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 3, name: "t" });
    for (let i = 0; i < 3; i++) {
      expect(call(limiter, "u1").passed).toBe(true);
    }
  });

  test("blocks the request after the limit with 429", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 2, name: "t" });
    call(limiter, "u1");
    call(limiter, "u1");
    const { passed, res } = call(limiter, "u1");

    expect(passed).toBe(false);
    expect(res.statusCode).toBe(429);
    expect(String((res.body as { error: string }).error)).toContain("Too many requests");
  });

  test("counts each user separately", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, name: "t" });
    expect(call(limiter, "alice").passed).toBe(true);
    expect(call(limiter, "bob").passed).toBe(true);
    expect(call(limiter, "alice").passed).toBe(false);
  });

  test("reports the remaining budget", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 5, name: "t" });
    const first = call(limiter, "u1");
    expect(first.res.headers["RateLimit-Limit"]).toBe("5");
    expect(first.res.headers["RateLimit-Remaining"]).toBe("4");
  });

  test("tells a blocked caller when to retry", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, name: "t" });
    call(limiter, "u1");
    const { res } = call(limiter, "u1");
    expect(Number(res.headers["Retry-After"])).toBeGreaterThan(0);
  });

  test("the window resets", async () => {
    const limiter = rateLimit({ windowMs: 30, max: 1, name: "t" });
    expect(call(limiter, "u1").passed).toBe(true);
    expect(call(limiter, "u1").passed).toBe(false);
    await new Promise((r) => setTimeout(r, 45));
    expect(call(limiter, "u1").passed).toBe(true);
  });

  test("falls back to the IP for unauthenticated callers", () => {
    const limiter = rateLimit({ windowMs: 60_000, max: 1, name: "t" });
    const anon = () => {
      const res = makeRes();
      let passed = false;
      limiter({ ip: "9.9.9.9" } as never, res as never, () => {
        passed = true;
      });
      return passed;
    };
    expect(anon()).toBe(true);
    expect(anon()).toBe(false);
  });
});
