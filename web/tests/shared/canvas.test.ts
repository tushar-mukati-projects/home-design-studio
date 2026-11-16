import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const webCopy = join(import.meta.dir, "../../src/shared/canvas.ts");
const serverSource = join(import.meta.dir, "../../../server/src/shared/canvas.ts");

describe("shared canvas module", () => {
  test("the web copy is identical to the server source", () => {
    expect(readFileSync(webCopy, "utf8")).toBe(readFileSync(serverSource, "utf8"));
  });
});
