import { describe, expect, test } from "bun:test";
import { exportFileName } from "@/features/editor/export/capture";

describe("exportFileName", () => {
  test.each([
    ["Kitchen plan", "Kitchen plan"],
    ["Café — étage 2", "Café — étage 2"],
    ["客厅 🛋️", "客厅 🛋️"],
    ['a<b>c:d"e/f\\g|h?i*j', "abcdefghij"],
    ["tab\there", "tabhere"],
    ["  ???  ", "untitled"],
    ["", "untitled"],
  ])("%j becomes %j", (name, expected) => {
    expect(exportFileName(name)).toBe(expected);
  });
});
