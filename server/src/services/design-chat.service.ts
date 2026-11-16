import { streamText, tool, stepCountIs, type TextStreamPart } from "ai";
import { z } from "zod";
import type { Response } from "express";
import { getDesignById, updateDesign } from "./design.service";
import { currentCanvas } from "../collaboration/hocuspocus";
import { AI_MAX_RETRIES, AI_TIMEOUT_MS, languageModel } from "../lib/ai-client";
import { prisma } from "../lib/db";
import { errorMessage } from "../lib/http-error";
import { logger } from "../lib/logger";
import { serializeFurnitureItem } from "../lib/serializers";
import { runEventStream, type EventStream } from "../lib/sse";
import { canvasSchema } from "../shared/canvas";
import { DESIGN_CHAT_SYSTEM_PROMPT } from "./design-chat/prompt";
import { describeCanvas, reviewCanvas } from "./design-chat/summary";
import { editCanvasInputSchema, setCanvasInputSchema } from "./design-chat/tool-input";
import {
  editCanvas,
  newSession,
  setCanvas,
  type ChatSession,
  type ToolResult,
} from "./design-chat/tools";

const DESIGN_CHAT_MAX_STEPS = 25;
const DESIGN_CHAT_TIMEOUT_MS = 5 * 60_000;
const DESIGN_CHAT_FAILED_MESSAGE = "Design AI hit an error. Please try again.";

type ChatMessage = { role: "user" | "assistant"; content: string };
type Viewer = { designId: string; userId: string; email: string | undefined };
type ChatTools = ReturnType<typeof chatTools>;

export const designChatStream = async (
  designId: string,
  userId: string,
  email: string | undefined,
  messages: ChatMessage[],
  res: Response,
) => {
  const model = languageModel();
  const session = newSession();

  await runEventStream(
    res,
    () => DESIGN_CHAT_FAILED_MESSAGE,
    async (stream) => {
      const result = streamText({
        model,
        system: DESIGN_CHAT_SYSTEM_PROMPT,
        messages,
        tools: chatTools(session, { designId, userId, email }),
        stopWhen: stepCountIs(DESIGN_CHAT_MAX_STEPS),
        maxRetries: AI_MAX_RETRIES,
        timeout: { stepMs: AI_TIMEOUT_MS, totalMs: DESIGN_CHAT_TIMEOUT_MS },
        abortSignal: stream.signal,
      });
      for await (const part of result.fullStream) relay(stream, part, designId);
    },
  );
};

const relay = (stream: EventStream, part: TextStreamPart<ChatTools>, designId: string) => {
  switch (part.type) {
    case "text-delta":
      return stream.send("text", { content: part.text });
    case "tool-call":
      return stream.send("tool_call", { name: part.toolName });
    case "tool-result":
      if (!part.dynamic && part.output.action) stream.send("action", part.output.action);
      return stream.send("tool_done", { name: part.toolName });
    case "tool-error":
      logger.error("design-chat tool failed", {
        designId,
        tool: part.toolName,
        error: errorMessage(part.error),
      });
      return stream.send("tool_done", { name: part.toolName });
    case "error":
      throw part.error;
    default:
      return;
  }
};

const chatTools = (session: ChatSession, viewer: Viewer) => ({
  fetch_canvas: tool({
    description:
      "Fetch the current floor plan — walls, openings, rooms, furniture — plus the furniture catalog. ALWAYS call this first so you know the current state and the valid furniture item ids.",
    inputSchema: z.object({}),
    execute: async (): Promise<ToolResult> => {
      const [design, items] = await Promise.all([
        getDesignById(viewer.designId, { userId: viewer.userId, email: viewer.email }),
        prisma.furnitureItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
      ]);
      if (design.permission === "readonly") {
        return { summary: "You have view-only access to this design, so it cannot be changed." };
      }
      session.catalog = items.map(serializeFurnitureItem);
      session.canvas = currentCanvas(viewer.designId, design.canvasData);
      session.loaded = true;
      session.dirty = false;
      return { summary: describeCanvas(session, design.name) };
    },
  }),

  set_canvas: tool({
    description:
      "Replace the ENTIRE floor plan in one atomic call. Use for any new design, full redesign or 'start over'. Plan every room and every piece of furniture before calling.",
    inputSchema: setCanvasInputSchema,
    execute: async (input): Promise<ToolResult> => setCanvas(session, input),
  }),

  edit_canvas: tool({
    description: `Apply one targeted edit. Use for small changes only; use set_canvas for redesigns. Operations:
- add_wall: from, to required; thickness optional
- add_room: name, usage, x, y, width, height required
- place_furniture: item (catalog id), at required; rotation optional
- add_opening: kind, wallIndex, offset required; width, variant optional
- remove_element: collection (walls|openings|rooms|furniture), elementId required
- clear_all: removes everything`,
    inputSchema: editCanvasInputSchema,
    execute: async (input): Promise<ToolResult> => editCanvas(session, input),
  }),

  review_canvas: tool({
    description:
      "Get an exact snapshot of the floor plan — positions, sizes and ids. Use to verify placement or to find an id before removing something.",
    inputSchema: z.object({}),
    execute: async (): Promise<ToolResult> => ({ summary: reviewCanvas(session) }),
  }),

  save_canvas: tool({
    description:
      "Persist all changes. Always call this after editing — nothing is saved until you do.",
    inputSchema: z.object({}),
    execute: async (): Promise<ToolResult> => {
      if (!session.loaded) return { summary: "Call fetch_canvas first before saving." };
      if (!session.dirty) {
        return {
          summary:
            "Nothing to save — no changes were made this turn. Saving now would overwrite edits other people may have made since the canvas was fetched.",
        };
      }
      await updateDesign(
        viewer.designId,
        { canvasData: canvasSchema.parse(session.canvas) },
        viewer.userId,
        viewer.email,
      );
      session.dirty = false;
      const { walls, rooms, furniture, openings } = session.canvas;
      return {
        summary: `Saved: ${walls.length} walls, ${rooms.length} rooms, ${furniture.length} furniture, ${openings.length} openings.`,
      };
    },
  }),
});
