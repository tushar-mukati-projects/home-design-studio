"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useDesignChat } from "./use-design-chat";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Wrench,
} from "lucide-react";

interface DesignChatProps {
  designId: string;
}

const SUGGESTIONS = [
  "Add a living room with sofa and TV",
  "Create a bedroom with a double bed",
  "Add a kitchen with island",
  "Build a 2-room apartment layout",
];

const TOOL_LABELS: Record<string, string> = {
  fetch_design: "Fetching design",
  edit_design: "Editing design",
  review_design: "Reviewing design",
  save_design: "Saving design",
};

const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="my-1">{children as React.ReactNode}</p>,
      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children as React.ReactNode}</ul>,
      ol: ({ children }) => (
        <ol className="my-1 ml-4 list-decimal">{children as React.ReactNode}</ol>
      ),
      li: ({ children }) => <li className="my-0.5">{children as React.ReactNode}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold">{children as React.ReactNode}</strong>
      ),
      code: ({ children }) => (
        <code className="bg-[var(--muted)] rounded px-1 py-0.5 text-xs">
          {children as React.ReactNode}
        </code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

export const DesignChat = ({ designId }: DesignChatProps) => {
  const { messages, isLoading, activeTools, sendMessage, clearMessages } = useDesignChat(designId);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const submit = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleClose = () => {
    setOpen(false);
    clearMessages();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 active:scale-95"
      >
        <Sparkles className="size-4" />
        Design AI
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-5 bottom-5 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl",
        "bg-[var(--card)] border-[var(--border)]",
        expanded ? "h-[85vh] w-[680px]" : "h-[560px] w-[420px]",
        "max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)]",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Design AI</p>
            <p className="text-[10px] text-[var(--muted-foreground)]">Describe what you want to build</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              title="Clear chat"
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize"
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Close"
            className="rounded-lg p-1.5 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[var(--card)] p-4">
        {messages.length === 0 ? (
          <EmptyState suggestions={SUGGESTIONS} onSuggestion={sendMessage} isLoading={isLoading} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} activeTools={activeTools} />
        )}
      </div>

      <form
        onSubmit={handleFormSubmit}
        className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-3"
      >
        <div className="flex items-end gap-2 rounded-xl bg-[var(--secondary)] px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to add... (Enter to send)"
            disabled={isLoading}
            rows={1}
            className="min-w-0 flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 active:scale-95"
                : "text-[var(--muted-foreground)] opacity-40",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 px-1 text-[10px] text-[var(--muted-foreground)]">
          Shift+Enter for new line · AI modifies your 2D canvas directly
        </p>
      </form>
    </div>
  );
};

interface EmptyStateProps {
  suggestions: string[];
  onSuggestion: (text: string) => void;
  isLoading: boolean;
}

const EmptyState = ({ suggestions, onSuggestion, isLoading }: EmptyStateProps) => (
  <div className="flex h-full flex-col items-center justify-center gap-4">
    <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
      <Sparkles className="size-6 text-violet-500" />
    </div>
    <div className="text-center">
      <p className="text-sm font-semibold text-[var(--foreground)]">Your AI Design Assistant</p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
        Describe rooms, furniture, or layouts and I&apos;ll build it on the canvas.
      </p>
    </div>
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={isLoading}
          onClick={() => onSuggestion(s)}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

import type { ChatMessage } from "./use-design-chat";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  activeTools: string[];
}

const MessageList = ({ messages, isLoading, activeTools }: MessageListProps) => (
  <div className="space-y-4">
    {messages.map((msg) => (
      <div
        key={msg.id}
        className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
      >
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            msg.role === "user"
              ? "rounded-br-md bg-[var(--primary)] text-[var(--primary-foreground)]"
              : "rounded-bl-md bg-[var(--secondary)] text-[var(--foreground)]",
          )}
        >
          {msg.role === "assistant" ? (
            <AssistantMessage msg={msg} isLoading={isLoading} />
          ) : (
            msg.content
          )}
        </div>
      </div>
    ))}
    {isLoading && <LoadingIndicator activeTools={activeTools} />}
  </div>
);

interface AssistantMessageProps {
  msg: ChatMessage;
  isLoading: boolean;
}

const AssistantMessage = ({ msg, isLoading }: AssistantMessageProps) => (
  <>
    {msg.toolCalls && msg.toolCalls.length > 0 && (
      <div className="mb-2 flex flex-wrap gap-1">
        {msg.toolCalls.map((toolName, i) => (
          <span
            key={`${toolName}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-500"
          >
            <Wrench className="size-2.5" />
            {TOOL_LABELS[toolName] ?? toolName}
          </span>
        ))}
      </div>
    )}
    {msg.content ? (
      <MarkdownMessage content={msg.content} />
    ) : !isLoading ? (
      <span className="text-xs italic text-[var(--muted-foreground)]">Done</span>
    ) : null}
  </>
);

const LoadingIndicator = ({ activeTools }: { activeTools: string[] }) => (
  <div className="flex flex-col gap-2">
    {activeTools.map((toolName, i) => (
      <div key={`active-${toolName}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-xs">
        <Wrench className="size-3 text-violet-500" />
        <span className="text-[var(--muted-foreground)]">{TOOL_LABELS[toolName] ?? toolName}...</span>
      </div>
    ))}
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-[var(--secondary)] px-3.5 py-2.5">
        <Loader2 className="size-3.5 animate-spin text-[var(--muted-foreground)]" />
        <span className="text-xs text-[var(--muted-foreground)]">
          {activeTools.length > 0 ? "Updating canvas..." : "Thinking..."}
        </span>
      </div>
    </div>
  </div>
);
