"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getToken } from "@/lib/axios";
import { useEditorStore } from "@/stores/editor-store";
import type { Canvas, Furniture, Opening, Room, Wall } from "@/types";

export interface ToolCall {
  name: string;
  status: "running" | "done";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
}

type SSEEvent =
  | { type: "tool_call"; name: string }
  | { type: "tool_done"; name: string }
  | { type: "action"; actionType: string; payload: Record<string, unknown> }
  | { type: "text"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };

const readErrorMessage = async (res: Response): Promise<string> => {
  if (res.status === 403)
    return "The AI design assistant is a Pro feature. Upgrade your plan to use it.";
  if (res.status === 401) return "Your session expired. Please refresh the page and sign in again.";
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {}
  return "Sorry, something went wrong. Please try again.";
};

const applyAction = (actionType: string, payload: Record<string, unknown>) => {
  const store = useEditorStore.getState();
  switch (actionType) {
    case "add_wall":
      return store.addWall(payload as unknown as Wall);
    case "add_room":
      return store.setRooms([...store.rooms, payload as unknown as Room], { recordHistory: true });
    case "place_furniture":
      return store.addFurniture(payload as unknown as Furniture);
    case "add_opening":
      return store.addOpening(payload as unknown as Opening);
    case "remove_element":
      return store.removeElement((payload as { elementId: string }).elementId);
    case "clear_design":
      return store.clearCanvas();
    case "set_canvas":
      return store.setCanvas(payload as unknown as Canvas);
  }
};

export const useDesignChat = (designId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
      const assistantMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantMsgId, role: "assistant", content: "", toolCalls: [] },
      ]);
      setIsLoading(true);
      setActiveTools([]);

      const token = await getToken();
      const history = [...messages, userMsg]
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      const patchAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantMsgId ? fn(m) : m)));

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/ai/design-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
            body: JSON.stringify({ designId, messages: history }),
          },
        );

        if (!res.ok) throw new Error(await readErrorMessage(res));
        if (!res.body) throw new Error("The assistant returned an empty response.");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") break;

            let event: SSEEvent;
            try {
              event = JSON.parse(raw) as SSEEvent;
            } catch {
              continue;
            }

            if (event.type === "tool_call") {
              const name = event.name;
              setActiveTools((prev) => [...prev, name]);
              patchAssistant((m) => ({
                ...m,
                toolCalls: [...(m.toolCalls ?? []), { name, status: "running" }],
              }));
            } else if (event.type === "tool_done") {
              const name = event.name;
              setActiveTools((prev) => {
                const idx = prev.indexOf(name);
                return idx === -1 ? prev : [...prev.slice(0, idx), ...prev.slice(idx + 1)];
              });
              patchAssistant((m) => {
                const calls = [...(m.toolCalls ?? [])];
                const idx = calls.findIndex((tc) => tc.name === name && tc.status === "running");
                if (idx !== -1) calls[idx] = { ...calls[idx], status: "done" };
                return { ...m, toolCalls: calls };
              });
            } else if (event.type === "action") {
              const store = useEditorStore.getState();
              store.beginBatch();
              try {
                applyAction(event.actionType, event.payload);
              } finally {
                store.endBatch();
              }
            } else if (event.type === "text") {
              const text = event.content;
              patchAssistant((m) => ({ ...m, content: m.content + text }));
            } else if (event.type === "error") {
              const message = event.message;
              patchAssistant((m) => ({
                ...m,
                content: m.content || `Error: ${message}`,
                toolCalls: (m.toolCalls ?? []).map((tc) =>
                  tc.status === "running" ? { ...tc, status: "done" } : tc,
                ),
              }));
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Sorry, something went wrong. Please try again.";
        patchAssistant((m) => ({
          ...m,
          content: message,
          toolCalls: (m.toolCalls ?? []).map((tc) =>
            tc.status === "running" ? { ...tc, status: "done" } : tc,
          ),
        }));
      } finally {
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
