"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import { AiAvatar } from "./ai-avatar";
import { CHAT_MESSAGE_MAX_CHARS } from "@/shared/canvas";
import { EmptyState } from "./empty-state";
import { MessageList } from "./message-list";
import { toolConfig } from "./tool-pill";
import { useDesignChat } from "./use-design-chat";

type DesignChatProps = {
  designId: string;
  onUpgradeRequired: () => void;
};

const COMPOSER_MAX_HEIGHT_PX = 120;
const HEADER_BUTTON_CLASS =
  "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
const BUSY_MESSAGE = "Design AI is still working on your last request";
const EMPTY_INPUT_MESSAGE = "Type what you want to build first";

export const DesignChat = ({ designId, onUpgradeRequired }: DesignChatProps) => {
  const { messages, isLoading, activeTools, sendMessage, clearMessages } = useDesignChat(designId);
  const { data: plan } = useFetchPlan();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const submit = () => {
    if (isLoading) return toast.info(BUSY_MESSAGE);
    if (!input.trim()) return toast.info(EMPTY_INPUT_MESSAGE);
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    submit();
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, COMPOSER_MAX_HEIGHT_PX)}px`;
  };

  const handleClose = () => {
    setOpen(false);
    clearMessages();
  };

  const aiLocked = plan !== undefined && !plan.canUseAI;
  const status = isLoading
    ? activeTools.length > 0
      ? `${toolConfig(activeTools[activeTools.length - 1]).label}…`
      : "Thinking…"
    : "Describe what you want to build";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (aiLocked ? onUpgradeRequired() : setOpen(true))}
        aria-label={aiLocked ? "Design AI (Pro plan required)" : "Open Design AI"}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
      >
        {aiLocked ? <Lock className="size-4" /> : <Sparkles className="size-4" />}
        Design AI
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-5 bottom-5 z-50 flex flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/20 transition-all duration-200",
        expanded ? "h-[85vh] w-170" : "h-145 w-105",
        "max-h-[calc(100vh-2.5rem)] max-w-[calc(100vw-2.5rem)]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <AiAvatar size="md" />
          <div>
            <p className="text-sm leading-tight font-semibold text-foreground">Design AI</p>
            <p className="text-2xs leading-tight text-muted-foreground">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              title="Clear chat"
              className={HEADER_BUTTON_CLASS}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Shrink" : "Expand"}
            className={HEADER_BUTTON_CLASS}
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize"
            className={HEADER_BUTTON_CLASS}
          >
            <Minus className="size-3.5" />
          </button>
          <button type="button" onClick={handleClose} title="Close" className={HEADER_BUTTON_CLASS}>
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState onSuggestion={sendMessage} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className="shrink-0 border-t border-border bg-card p-3">
        <form onSubmit={handleSubmit}>
          <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-all focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what to add…"
              maxLength={CHAT_MESSAGE_MAX_CHARS}
              rows={1}
              className="min-w-0 flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              style={{ maxHeight: `${COMPOSER_MAX_HEIGHT_PX}px` }}
            />
            <button
              type="submit"
              aria-label="Send"
              className={cn(
                "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                input.trim() && !isLoading
                  ? "bg-primary text-primary-foreground shadow-lg hover:opacity-90 active:scale-95"
                  : "text-muted-foreground opacity-30",
              )}
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 px-0.5 text-2xs text-muted-foreground">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
};
