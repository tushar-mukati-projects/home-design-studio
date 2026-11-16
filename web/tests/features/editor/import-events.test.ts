import { describe, test, expect } from "bun:test";
import { importEventSchema } from "@/features/editor/import/import-events";
import { emptyCanvas } from "@/shared/canvas";

const wall = { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };
const canvas = { ...emptyCanvas(), walls: [wall] };

const ACCEPTED: [string, unknown][] = [
  ["a status event", { type: "status", message: "Reading the image" }],
  ["an error event", { type: "error", message: "Nothing to see here" }],
  ["a result event with a full canvas", { type: "result", canvas }],
];

const REJECTED: [string, unknown][] = [
  ["a result without a canvas", { type: "result" }],
  ["an unknown event type", { type: "progress", message: "50%" }],
];

describe("importEventSchema", () => {
  test.each(ACCEPTED)("accepts %s", (_, event) => {
    expect(importEventSchema.safeParse(event).success).toBe(true);
  });

  test.each(REJECTED)("rejects %s", (_, event) => {
    expect(importEventSchema.safeParse(event).success).toBe(false);
  });
});
