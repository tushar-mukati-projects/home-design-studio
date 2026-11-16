import { describe, test, expect } from "bun:test";
import { ERROR_CODES, httpError, isHttpError } from "@/lib/http-error";

describe("httpError", () => {
  test("carries the status, the code and the code's message", () => {
    const err = httpError(404, "DESIGN_NOT_FOUND");
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.code).toBe("DESIGN_NOT_FOUND");
    expect(err.message).toBe(ERROR_CODES.DESIGN_NOT_FOUND);
    expect(err.details).toEqual({});
  });

  test("keeps extra response fields", () => {
    expect(httpError(403, "DESIGN_LIMIT_REACHED", { limit: 3 }).details).toEqual({ limit: 3 });
  });
});

describe("isHttpError", () => {
  test.each([
    ["one of our coded errors", httpError(400, "SHARE_SELF"), true],
    ["a plain error", new Error("boom"), false],
    [
      "a raw-body style error",
      Object.assign(new Error("x"), { status: 400, code: "ECONNABORTED" }),
      false,
    ],
    ["a non-error", { status: 404, code: "NOT_FOUND" }, false],
  ])("%s", (_label, value, expected) => {
    expect(isHttpError(value)).toBe(expected);
  });
});
