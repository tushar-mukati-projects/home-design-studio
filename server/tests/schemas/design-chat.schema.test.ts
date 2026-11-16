import { describe, test, expect } from "bun:test";
import { designChatSchema } from "@/schemas/design-chat.schema";

const DESIGN_ID = "0b9f0c1e-1111-4222-8333-944445555666";

const messages = (count: number, chars: number) =>
  Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: "x".repeat(chars),
  }));

const parse = (count: number, chars: number) =>
  designChatSchema.safeParse({ body: { designId: DESIGN_ID, messages: messages(count, chars) } });

describe("designChatSchema", () => {
  test.each([
    ["30 messages of 600 characters", 30, 600, true],
    ["2 messages of 10,000 characters", 2, 10_000, true],
    ["31 messages", 31, 10, false],
    ["3 messages adding up to 20,001 characters", 3, 6_667, false],
    ["one message over 10,000 characters", 1, 10_001, false],
  ])("%s", (_label, count, chars, accepted) => {
    expect(parse(count, chars).success).toBe(accepted);
  });

  test("an oversized history fails on body.messages", () => {
    const result = parse(3, 6_667);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual(["body.messages"]);
  });
});
