"use client";

import { useState, useRef, useCallback } from "react";
import { getToken } from "@/lib/axios";
import { useEditorStore } from "@/stores/editor-store";
import type { Wall, Room, PlacedFurniture, Door, Window } from "@/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: string[];
}

type SSEEvent =
  | { type: "tool_call"; name: string }
  | { type: "action"; actionType: string; payload: Record<string, unknown> }
  | { type: "text"; content: string }
  | { type: "error"; message: string }
  | { type: "done" };

export const useDesignChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const applyAction = useCallback(
    (actionType: string, payload: Record<string, unknown>) => {
      const store = useEditorStore.getState();
      switch (actionType) {
        case "add_wall":
          store.addWall(payload as unknown as Wall);
          break;
        case "add_room":
          store.setRooms([...store.rooms, payload as unknown as Room]);
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
        case "clear_design":
          store.clearCanvas();
          break;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return;

      const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content };
      const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", toolCalls: [] };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setActiveTools([]);

      const token = await getToken();
      const state = useEditorStore.getState();
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/ai/design-chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            signal: controller.signal,
            body: JSON.stringify({
              messages: history,
              canvasState: {
                walls: state.walls,
                rooms: state.rooms,
                furniture: state.furniture,
                doors: state.doors,
                windows: state.windows,
              },
            }),
          },
        );

        if (!res.ok || !res.body) throw new Error("Request failed");

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
                  m.id === assistantMsg.id
                    ? { ...m, toolCalls: [...(m.toolCalls ?? []), event.name] }
                    : m,
                ),
              );
            } else if (event.type === "action") {
              applyAction(event.actionType, event.payload);
            } else if (event.type === "text") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: m.content + event.content } : m,
                ),
              );
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "Sorry, something went wrong. Please try again." }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
        setActiveTools([]);
        abortRef.current = null;
      }
    },
    [isLoading, messages, applyAction],
  );

  const clearMessages = useCallback(() => setMessages([]), []);
  const abort = useCallback(() => abortRef.current?.abort(), []);

  return { messages, isLoading, activeTools, sendMessage, clearMessages, abort };
};
