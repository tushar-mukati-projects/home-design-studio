"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { isAbortError, readSseEvents } from "@/lib/sse";
import { useEditorStore } from "@/stores/editor-store";
import { openSseStream } from "../open-sse-stream";
import { applyAction, chatEventSchema } from "./chat-events";
import type { ChatEvent } from "./chat-events";
import { recentHistory, type HistoryMessage } from "./chat-history";

type ToolStatus = "running" | "done";

export type ToolCall = {
  name: string;
  status: ToolStatus;
};

export type ChatMessage = HistoryMessage & {
  id: string;
  toolCalls: ToolCall[];
};

type PatchReply = (fn: (message: ChatMessage) => ChatMessage) => void;
type SetActiveTools = Dispatch<SetStateAction<string[]>>;

const CHAT_PATH = "/ai/design-chat";
const GENERIC_ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";

export const useDesignChat = (designId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        toolCalls: [],
      };
      const replyId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMessage,
        { id: replyId, role: "assistant", content: "", toolCalls: [] },
      ]);
      setIsLoading(true);
      setActiveTools([]);

      const history: HistoryMessage[] = recentHistory(
        [...messages, userMessage]
          .filter((m) => m.content.trim().length > 0)
          .map((m) => ({ role: m.role, content: m.content })),
      );
      const controller = new AbortController();
      abortRef.current = controller;
      const patchReply: PatchReply = (fn) =>
        setMessages((prev) => prev.map((m) => (m.id === replyId ? fn(m) : m)));
      let batchOpen = false;

      try {
        const body = await openSseStream(
          CHAT_PATH,
          { designId, messages: history },
          controller.signal,
        );
        for await (const event of readSseEvents(body, chatEventSchema)) {
          if (event.type === "action" && !batchOpen) {
            useEditorStore.getState().beginBatch();
            batchOpen = true;
          }
          applyEvent(event, patchReply, setActiveTools);
        }
      } catch (err) {
        if (isAbortError(err)) return;
        const message = err instanceof Error && err.message ? err.message : GENERIC_ERROR_MESSAGE;
        patchReply((m) => ({
          ...m,
          content: appendLine(m.content, message),
          toolCalls: finishTools(m.toolCalls),
        }));
      } finally {
        if (batchOpen) useEditorStore.getState().endBatch();
        setIsLoading(false);
        setActiveTools([]);
        abortRef.current = null;
      }
    },
    [isLoading, messages, designId],
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);
  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages, abort };
};

const applyEvent = (event: ChatEvent, patchReply: PatchReply, setActiveTools: SetActiveTools) => {
  switch (event.type) {
    case "text":
      return patchReply((m) => ({ ...m, content: m.content + event.content }));
    case "tool_call":
      setActiveTools((prev) => [...prev, event.name]);
      return patchReply((m) => ({
        ...m,
        toolCalls: [...m.toolCalls, { name: event.name, status: "running" }],
      }));
    case "tool_done":
      setActiveTools((prev) => prev.filter((_, i) => i !== prev.indexOf(event.name)));
      return patchReply((m) => ({ ...m, toolCalls: finishTool(m.toolCalls, event.name) }));
    case "action":
      return applyAction(event);
    case "error":
      return patchReply((m) => ({
        ...m,
        content: appendLine(m.content, event.message),
        toolCalls: finishTools(m.toolCalls),
      }));
  }
};

const appendLine = (content: string, line: string): string =>
  content ? `${content}\n${line}` : line;

const finishTool = (calls: ToolCall[], name: string): ToolCall[] => {
  const idx = calls.findIndex((tc) => tc.name === name && tc.status === "running");
  return calls.map((tc, i) => (i === idx ? { ...tc, status: "done" } : tc));
};

const finishTools = (calls: ToolCall[]): ToolCall[] =>
  calls.map((tc) => (tc.status === "running" ? { ...tc, status: "done" } : tc));
