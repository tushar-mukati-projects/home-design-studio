"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useFetchPlan } from "@/hooks/billing";
import { useDesignChat } from "./use-design-chat";
import type { ChatMessage, ToolCall } from "./use-design-chat";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Minus,
  Maximize2,
  Minimize2,
  Trash2,
  Check,
  Database,
  PencilRuler,
  Eye,
  Save,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";

interface DesignChatProps {
  designId: string;
  onUpgradeRequired?: () => void;
}

const SUGGESTIONS = [
  "Add a living room with sofa and TV",
  "Create a bedroom with a double bed",
  "Add a kitchen with island",
  "Build a 2-room apartment layout",
];

const TOOL_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  fetch_canvas: {
    label: "Reading canvas",
    icon: <Database className="size-3" />,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  set_canvas: {
    label: "Building layout",
    icon: <PencilRuler className="size-3" />,
    color: "text-violet-600 bg-violet-50 border-violet-200",
  },
  edit_canvas: {
    label: "Editing canvas",
    icon: <PencilRuler className="size-3" />,
    color: "text-violet-600 bg-violet-50 border-violet-200",
  },
  review_canvas: {
    label: "Reviewing layout",
    icon: <Eye className="size-3" />,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  save_canvas: {
    label: "Saving design",
    icon: <Save className="size-3" />,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
};

const MarkdownMessage = ({ content }: { content: string }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }) => <p className="my-1 leading-relaxed">{children as React.ReactNode}</p>,
      ul: ({ children }) => (
        <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children as React.ReactNode}</ul>
      ),
      ol: ({ children }) => (
        <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children as React.ReactNode}</ol>
      ),
      li: ({ children }) => <li className="leading-relaxed">{children as React.ReactNode}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold">{children as React.ReactNode}</strong>
      ),
      code: ({ children }) => (
        <code className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[11px]">
          {children as React.ReactNode}
        </code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);

const ToolPill = ({ tool }: { tool: ToolCall }) => {
  const config = TOOL_CONFIG[tool.name] ?? {
    label: tool.name,
    icon: <PencilRuler className="size-3" />,
    color: "text-zinc-600 bg-zinc-50 border-zinc-200",
  };
  const done = tool.status === "done";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
        config.color,
        done && "opacity-60",
      )}
    >
      {done ? <Check className="size-3" /> : <Loader2 className="size-3 animate-spin" />}
      {config.icon}
      {config.label}
    </span>
  );
};

const AssistantMessage = ({ msg, isLoading }: { msg: ChatMessage; isLoading: boolean }) => {
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const tools = msg.toolCalls ?? [];
  const doneTools = tools.filter((t) => t.status === "done");
  const hasTools = tools.length > 0;

  return (
    <div className="space-y-2">
      {hasTools && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setToolsExpanded((v) => !v)}
            className="flex items-center gap-1 text-[10px] font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            {toolsExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {doneTools.length}/{tools.length} steps completed
          </button>

          {toolsExpanded && (
            <div className="flex flex-wrap gap-1.5">
              {tools.map((tc, i) => (
                <ToolPill key={`${tc.name}-${i}`} tool={tc} />
              ))}
            </div>
          )}
        </div>
      )}

      {msg.content ? (
        <div className="text-sm">
          <MarkdownMessage content={msg.content} />
        </div>
      ) : !isLoading ? (
        <span className="text-xs text-[var(--muted-foreground)] italic">Done</span>
      ) : null}
    </div>
  );
};

export const DesignChat = ({ designId, onUpgradeRequired }: DesignChatProps) => {
  const { messages, isLoading, activeTools, sendMessage, clearMessages } = useDesignChat(designId);
  const { data: planData } = useFetchPlan();
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

  const aiLocked = planData ? !planData.canUseAI : false;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => (aiLocked ? onUpgradeRequired?.() : setOpen(true))}
        aria-label={aiLocked ? "Design AI (Pro plan required)" : "Open Design AI"}
        className="fixed right-5 bottom-5 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-500/40 active:scale-95"
      >
        {aiLocked ? <Lock className="size-4" /> : <Sparkles className="size-4" />}
        Design AI
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed right-5 bottom-5 z-50 flex flex-col overflow-hidden rounded-2xl shadow-2xl shadow-black/20",
        "border border-[var(--border)] bg-[var(--background)]",
        expanded ? "h-[85vh] w-[680px]" : "h-[580px] w-[420px]",
        "max-h-[calc(100vh-40px)] max-w-[calc(100vw-40px)]",
        "transition-all duration-200",
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-sm">
            <Sparkles className="size-4 text-white" />
          </div>
          <div>
            <p className="text-sm leading-tight font-semibold text-[var(--foreground)]">
              Design AI
            </p>
            <p className="text-[10px] leading-tight text-[var(--muted-foreground)]">
              {isLoading
                ? activeTools.length > 0
                  ? `${TOOL_CONFIG[activeTools[activeTools.length - 1]]?.label ?? "Working"}…`
                  : "Thinking…"
                : "Describe what you want to build"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
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

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <EmptyState suggestions={SUGGESTIONS} onSuggestion={sendMessage} isLoading={isLoading} />
        ) : (
          <MessageList messages={messages} isLoading={isLoading} />
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--border)] bg-[var(--card)] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 transition-all focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Describe what to add…"
              disabled={isLoading}
              rows={1}
              className="min-w-0 flex-1 resize-none bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "mb-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg transition-all",
                input.trim() && !isLoading
                  ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm hover:opacity-90 active:scale-95"
                  : "text-[var(--muted-foreground)] opacity-30",
              )}
            >
              {isLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
            </button>
          </div>
          <p className="mt-1.5 px-0.5 text-[10px] text-[var(--muted-foreground)]">
            Enter to send · Shift+Enter for new line
          </p>
        </form>
      </div>
    </div>
  );
};

const EmptyState = ({
  suggestions,
  onSuggestion,
  isLoading,
}: {
  suggestions: string[];
  onSuggestion: (text: string) => void;
  isLoading: boolean;
}) => (
  <div className="flex h-full flex-col items-center justify-center gap-5 px-4 text-center">
    <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10">
      <Sparkles className="size-7 text-violet-600" />
    </div>
    <div>
      <p className="text-sm font-semibold text-[var(--foreground)]">Your AI Design Assistant</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--muted-foreground)]">
        Tell me what to build and I&apos;ll add walls, rooms, and furniture directly onto your
        canvas.
      </p>
    </div>
    <div className="flex w-full flex-col gap-1.5">
      {suggestions.map((s) => (
        <button
          key={s}
          type="button"
          disabled={isLoading}
          onClick={() => onSuggestion(s)}
          className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-left text-xs text-[var(--foreground)] transition-colors hover:bg-[var(--secondary)] disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

const MessageList = ({ messages, isLoading }: { messages: ChatMessage[]; isLoading: boolean }) => (
  <div className="space-y-5">
    {messages.map((msg, idx) => {
      const isLast = idx === messages.length - 1;
      return (
        <div key={msg.id} className="space-y-1">
          {msg.role === "user" ? (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-[var(--foreground)] px-3.5 py-2.5 text-sm text-[var(--background)]">
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <AssistantMessage msg={msg} isLoading={isLoading && isLast} />
              </div>
            </div>
          )}
        </div>
      );
    })}

    {isLoading && messages[messages.length - 1]?.role === "user" && (
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
          <Sparkles className="size-3.5 text-white" />
        </div>
        <div className="flex items-center gap-1 pt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 animate-bounce rounded-full bg-[var(--muted-foreground)] opacity-60"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    )}
  </div>
);
