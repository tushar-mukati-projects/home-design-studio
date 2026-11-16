import { describe, test, expect } from "bun:test";
import { shade } from "@/lib/colors";

describe("shade", () => {
  test.each([
    ["#000000", 0.5, "#808080"],
    ["#ffffff", -0.5, "#808080"],
    ["#336699", 0, "#336699"],
    ["#336699", -0.2, "#29527a"],
    ["#336699", 1, "#ffffff"],
    ["#336699", -1, "#000000"],
    ["abc", 0.3, "abc"],
  ])("shade(%s, %p) is %s", (hex, amount, expected) => {
    expect(shade(hex, amount)).toBe(expected);
  });
});
