import { describe, expect, test } from "bun:test";

import { throttleCursor } from "@/features/editor/collaboration/cursor-throttle";

const SETTLE_MS = 120;

const recorder = () => {
  const sent: [number, number][] = [];
  const throttle = throttleCursor((x, y) => sent.push([x, y]));
  return { sent, throttle };
};

describe("throttleCursor", () => {
  test("the first move is sent at once", () => {
    const { sent, throttle } = recorder();
    throttle.move(1, 2);
    expect(sent).toEqual([[1, 2]]);
  });

  test("moves inside the window collapse into the latest one, sent after the window", async () => {
    const { sent, throttle } = recorder();
    throttle.move(1, 1);
    throttle.move(2, 2);
    throttle.move(3, 3);
    expect(sent).toEqual([[1, 1]]);
    await Bun.sleep(SETTLE_MS);
    expect(sent).toEqual([
      [1, 1],
      [3, 3],
    ]);
  });

  test("stop cancels a pending move", async () => {
    const { sent, throttle } = recorder();
    throttle.move(1, 1);
    throttle.move(2, 2);
    throttle.stop();
    await Bun.sleep(SETTLE_MS);
    expect(sent).toEqual([[1, 1]]);
  });
});
