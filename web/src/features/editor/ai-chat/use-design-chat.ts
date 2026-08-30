"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { getToken } from "@/lib/axios";
import { useEditorStore } from "@/stores/editor-store";
import type { Wall, Room, PlacedFurniture, Door, Window } from "@/types";

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
  if (res.status === 403) {
    return "The AI design assistant is a Pro feature. Upgrade your plan to use it.";
  }
  if (res.status === 401) {
    return "Your session expired. Please refresh the page and sign in again.";
  }
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {}
  return "Sorry, something went wrong. Please try again.";
};

export const useDesignChat = (designId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const applyAction = useCallback((actionType: string, payload: Record<string, unknown>) => {
    const store = useEditorStore.getState();
    switch (actionType) {
      case "add_wall":
        store.addWall(payload as unknown as Wall);
        break;
      case "add_room":
        store.setRooms([...store.rooms, payload as unknown as Room], { recordHistory: true });
        break;
      case "place_furniture":
        store.addFurniture(payload as unknown as PlacedFurniture);
        break;
      case "add_door":
        store.addDoor(payload as unknown as Door);
        break;
      case "add_window":
        store.addWindow(payload as unknown as Window);
        break;
      case "remove_element": {
        const { elementType, elementId } = payload as { elementType: string; elementId: string };
        switch (elementType) {
          case "wall":
            store.removeWall(elementId);
            break;
          case "room":
            store.setRooms(
              store.rooms.filter((r) => r.id !== elementId),
              { recordHistory: true },
            );
            break;
          case "furniture":
            store.removeFurniture(elementId);
            break;
          case "door":
            store.removeDoor(elementId);
            break;
          case "window":
            store.removeWindow(elementId);
            break;
        }
        break;
      }
      case "clear_design":
        store.clearCanvas();
        break;
      case "set_canvas":
        store.setCanvas(
          payload as {
            walls: Wall[];
            rooms: Room[];
            furniture: PlacedFurniture[];
            doors: Door[];
            windows: Window[];
          },
        );
        break;
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
      const assistantMsgId = crypto.randomUUID();
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setActiveTools([]);

      const token = await getToken();
      const history = [...messages, userMsg]
        .filter((m) => m.content.trim().length > 0)
        .map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

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
              setActiveTools((prev) => [...prev, event.name]);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        toolCalls: [
                          ...(m.toolCalls ?? []),
                          { name: event.name, status: "running" as const },
                        ],
                      }
                    : m,
                ),
              );
            } else if (event.type === "tool_done") {
              const doneName = event.name;
              setActiveTools((prev) => {
                const idx = prev.indexOf(doneName);
                if (idx === -1) return prev;
                return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
              });
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== assistantMsgId) return m;
                  const calls = [...(m.toolCalls ?? [])];
                  const idx = calls.findIndex(
                    (tc) => tc.name === doneName && tc.status === "running",
                  );
                  if (idx !== -1) calls[idx] = { ...calls[idx], status: "done" as const };
                  return { ...m, toolCalls: calls };
                }),
              );
            } else if (event.type === "action") {
              const store = useEditorStore.getState();
              store.beginBatch();
              try {
                applyAction(event.actionType, event.payload);
              } finally {
                store.endBatch();
              }
            } else if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: m.content + event.content } : m,
                ),
              );
            } else if (event.type === "error") {
              const message = event.message;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: m.content || `Error: ${message}`,
                        toolCalls: (m.toolCalls ?? []).map((tc) =>
                          tc.status === "running" ? { ...tc, status: "done" as const } : tc,
                        ),
                      }
                    : m,
                ),
              );
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message =
          err instanceof Error && err.message
            ? err.message
            : "Sorry, something went wrong. Please try again.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: message,
                  toolCalls: (m.toolCalls ?? []).map((tc) =>
                    tc.status === "running" ? { ...tc, status: "done" as const } : tc,
                  ),
                }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        setActiveTools([]);
        abortRef.current = null;
      }
    },
    [isLoading, messages, designId, applyAction],
  );

  const abort = useCallback(() => abortRef.current?.abort(), []);
  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages, abort };
};
