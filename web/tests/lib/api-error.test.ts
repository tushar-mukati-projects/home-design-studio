import { describe, test, expect } from "bun:test";
import { AxiosError, AxiosHeaders } from "axios";
import { getApiErrorMessage } from "@/lib/api-error";

const axiosError = (status: number, data: unknown): AxiosError => {
  const err = new AxiosError("Request failed");
  err.response = {
    status,
    statusText: "",
    data,
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return err;
};

describe("getApiErrorMessage", () => {
  test("prefers the server's own message", () => {
    expect(
      getApiErrorMessage(axiosError(403, { error: "Pro plan required to share designs" })),
    ).toBe("Pro plan required to share designs");
    expect(getApiErrorMessage(axiosError(403, { error: "Design limit reached" }))).toBe(
      "Design limit reached",
    );
  });

  test("falls back to a readable message per status", () => {
    expect(getApiErrorMessage(axiosError(401, {}))).toContain("sign in");
    expect(getApiErrorMessage(axiosError(403, {}))).toContain("permission");
    expect(getApiErrorMessage(axiosError(404, {}))).toContain("no longer exists");
    expect(getApiErrorMessage(axiosError(503, {}))).toContain("temporarily unavailable");
  });

  test("explains an unreachable server rather than blaming the user", () => {
    const offline = new AxiosError("Network Error");
    expect(getApiErrorMessage(offline)).toContain("Cannot reach the server");
  });

  test("never returns an empty string", () => {
    for (const input of [undefined, null, {}, "", 0, new Error("")]) {
      expect(getApiErrorMessage(input).length).toBeGreaterThan(0);
    }
  });

  test("uses a plain Error's message", () => {
    expect(getApiErrorMessage(new Error("Canvas is not available"))).toBe(
      "Canvas is not available",
    );
  });

  test("honours a caller-supplied fallback", () => {
    expect(getApiErrorMessage({}, "Could not export")).toBe("Could not export");
  });

  test("ignores a non-string server error field", () => {
    expect(getApiErrorMessage(axiosError(500, { error: { nested: true } }))).not.toContain(
      "object",
    );
  });
});
