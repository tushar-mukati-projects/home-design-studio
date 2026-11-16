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

  test.each([
    [401, "Sign in again"],
    [403, "permission"],
    [404, "no longer exists"],
    [503, "Try again"],
  ])("falls back to a readable message for a %i", (status, fragment) => {
    expect(getApiErrorMessage(axiosError(status, {}))).toContain(fragment);
  });

  test("explains an unreachable server rather than blaming the user", () => {
    const offline = new AxiosError("Network Error");
    expect(getApiErrorMessage(offline)).toContain("can't connect");
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
