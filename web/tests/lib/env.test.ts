import { describe, test, expect } from "bun:test";

process.env.NEXT_PUBLIC_API_URL ??= "http://design.test/api";
const { collaborationUrl } = await import("@/lib/env");

describe("collaborationUrl", () => {
  test.each([
    ["http://localhost:4000/api", undefined, "ws://localhost:4000/collaboration"],
    ["http://localhost:4000/api/", undefined, "ws://localhost:4000/collaboration"],
    ["https://api.example.com/api", undefined, "wss://api.example.com/collaboration"],
    ["https://api.example.com", undefined, "wss://api.example.com/collaboration"],
    ["https://api.example.com/api", "", "wss://api.example.com/collaboration"],
    [
      "https://api.example.com/api",
      "wss://collab.example.com/collaboration",
      "wss://collab.example.com/collaboration",
    ],
  ])("%s with WS URL %p is %s", (apiUrl, wsUrl, expected) => {
    expect(collaborationUrl(apiUrl, wsUrl)).toBe(expected);
  });
});
