import { describe, test, expect } from "bun:test";
import { chatEventSchema } from "@/features/editor/ai-chat/chat-events";
import type { ChatEvent } from "@/features/editor/ai-chat/chat-events";
import { readSseEvents } from "@/lib/sse";
import { emptyCanvas } from "@/shared/canvas";

const wall = { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 };
const room = {
  id: "r1",
  name: "Living",
  usage: "living_room",
  polygon: [
    [0, 0],
    [4000, 0],
    [4000, 3000],
  ],
};
const furniture = { id: "f1", item: "sofa", at: [1000, 1000], rotation: 0 };
const opening = { id: "o1", kind: "door", wall: "w1", offset: 500, width: 900, height: 2100 };
const fullCanvas = { ...emptyCanvas(), walls: [wall], rooms: [room], furniture: [furniture] };

const action = (actionType: string, payload: unknown) => ({ type: "action", actionType, payload });

const ACCEPTED: [string, unknown][] = [
  ["text", { type: "text", content: "Adding a wall" }],
  ["tool_call", { type: "tool_call", name: "edit_canvas" }],
  ["tool_done", { type: "tool_done", name: "edit_canvas" }],
  ["error", { type: "error", message: "Out of credits" }],
  ["add_wall", action("add_wall", wall)],
  ["add_room", action("add_room", room)],
  ["place_furniture", action("place_furniture", furniture)],
  ["add_opening", action("add_opening", opening)],
  [
    "remove_element with an extra collection key",
    action("remove_element", { collection: "walls", elementId: "w1" }),
  ],
  ["clear_design", action("clear_design", {})],
  ["set_canvas with a full canvas", action("set_canvas", fullCanvas)],
];

const REJECTED: [string, unknown][] = [
  ["an unknown action type", action("paint_wall", {})],
  ["remove_element without an id", action("remove_element", { collection: "walls" })],
  ["an unknown event type", { type: "done" }],
];

describe("chatEventSchema", () => {
  test.each(ACCEPTED)("accepts %s", (_, event) => {
    expect(chatEventSchema.safeParse(event).success).toBe(true);
  });

  test.each(REJECTED)("rejects %s", (_, event) => {
    expect(chatEventSchema.safeParse(event).success).toBe(false);
  });
});

describe("readSseEvents with chat events", () => {
  test("yields only the events before [DONE]", async () => {
    const before: ChatEvent = { type: "text", content: "before" };
    const after: ChatEvent = { type: "text", content: "after" };
    const body = new Response(
      `data: ${JSON.stringify(before)}\n\ndata: [DONE]\n\ndata: ${JSON.stringify(after)}\n\n`,
    ).body;
    if (!body) throw new Error("Response has no body");

    const events: ChatEvent[] = [];
    for await (const event of readSseEvents(body, chatEventSchema)) events.push(event);

    expect(events).toEqual([before]);
  });
});
