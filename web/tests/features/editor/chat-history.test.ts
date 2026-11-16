import { describe, expect, test } from "bun:test";
import { recentHistory, type HistoryMessage } from "@/features/editor/ai-chat/chat-history";

const message = (content: string): HistoryMessage => ({ role: "user", content });

describe("recentHistory", () => {
  test("keeps a short conversation as it is", () => {
    const history = [message("a"), { role: "assistant", content: "b" } as const, message("c")];
    expect(recentHistory(history)).toEqual(history);
  });

  test("keeps only the 30 most recent messages", () => {
    const history = Array.from({ length: 40 }, (_, i) => message(`m${i}`));
    expect(recentHistory(history)).toEqual(history.slice(10));
  });

  test("drops the oldest messages once the total passes 20,000 characters", () => {
    const history = [
      message("x".repeat(8_000)),
      message("y".repeat(8_000)),
      message("z".repeat(8_000)),
    ];
    expect(recentHistory(history)).toEqual(history.slice(1));
  });

  test("an empty conversation stays empty", () => {
    expect(recentHistory([])).toEqual([]);
  });
});
