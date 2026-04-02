"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useDesignChat } from "./use-design-chat";
import { Sparkles, X, Send, Loader2, Minus, Maximize2, Minimize2, Trash2, Wrench } from "lucide-react";

const SUGGESTIONS = [
  "Add a living room with sofa and TV",
  "Create a bedroom with a double bed",
  "Add a kitchen with island",
  "Build a 2-room apartment layout",
];

const TOOL_LABELS: Record<string, string> = {
  get_design_summary: "Reading design",
  add_wall: "Adding wall",
  add_room: "Creating room",
  place_furniture: "Placing furniture",
  add_door: "Adding door",
  add_window: "Adding window",
  clear_design: "Clearing design",
};

const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="my-1">{children as React.ReactNode}</p>,
      ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children as React.ReactNode}</ul>,
      ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children as React.ReactNode}</ol>,
      li: ({ children }) => <li className="my-0.5">{children as React.ReactNode}</li>,
      strong: ({ children }) => <strong className="font-semibold">{children as React.ReactNode}</strong>,
      code: ({ children }) => (
        <code className="bg-muted rounded px-1 py-0.5 text-xs">{children as React.ReactNode}</code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

export const DesignChat = () => {
  const { messages, isLoading, activeTools, sendMessage, clearMessages } = useDesignChat();
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
        "bg-card border-border fixed right-5 bottom-5 z-50 flex flex-col overflow-hidden rounded-2xl border shadow-2xl",
        expanded ? "h-[85vh] w-[680px]" : "h-[560px] w-[420px]",
        "max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)]",
      )}
    >
      <div className="border-border flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
            <Sparkles className="size-3.5 text-white" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">Design AI</p>
            <p className="text-muted-foreground text-[10px]">Describe what you want to build</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearMessages}
              title="Clear chat"
              className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            title="Minimize"
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            <Minus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={handleClose}
            title="Close"
            className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg p-1.5 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState suggestions={SUGGESTIONS} onSuggestion={sendMessage} isLoading={isLoading} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} activeTools={activeTools} />
        )}
      </div>

      <form onSubmit={handleFormSubmit} className="border-border shrink-0 border-t p-3">
        <div className="bg-muted/60 flex items-end gap-2 rounded-xl px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe what to add... (Enter to send)"
            disabled={isLoading}
            rows={1}
            className="placeholder:text-muted-foreground text-foreground min-w-0 flex-1 resize-none bg-transparent text-sm outline-none"
            style={{ maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
              input.trim() && !isLoading
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "text-muted-foreground opacity-40",
            )}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </button>
        </div>
        <p className="text-muted-foreground mt-1.5 px-1 text-[10px]">
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
      <p className="text-foreground text-sm font-semibold">Your AI Design Assistant</p>
      <p className="text-muted-foreground mt-1 text-xs">
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
          className="border-border/60 hover:border-primary/30 hover:bg-accent/50 rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-50"
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
      <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
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
      <span className="text-muted-foreground text-xs italic">Done</span>
    ) : null}
  </>
);

const LoadingIndicator = ({ activeTools }: { activeTools: string[] }) => (
  <div className="flex flex-col gap-2">
    {activeTools.map((toolName, i) => (
      <div key={`active-${toolName}-${i}`} className="flex items-center gap-2 px-3 py-1.5 text-xs">
        <Wrench className="size-3 text-violet-500" />
        <span className="text-muted-foreground">{TOOL_LABELS[toolName] ?? toolName}...</span>
      </div>
    ))}
    <div className="flex justify-start">
      <div className="bg-muted flex items-center gap-2 rounded-2xl rounded-bl-md px-3.5 py-2.5">
        <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
        <span className="text-muted-foreground text-xs">
          {activeTools.length > 0 ? "Updating canvas..." : "Thinking..."}
        </span>
      </div>
    </div>
  </div>
);


