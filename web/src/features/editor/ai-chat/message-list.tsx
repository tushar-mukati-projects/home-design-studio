"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ChevronUp } from "lucide-react";
import { AiAvatar } from "./ai-avatar";
import { ToolPill } from "./tool-pill";
import type { ChatMessage } from "./use-design-chat";

type MessageListProps = {
  messages: ChatMessage[];
  isLoading: boolean;
};

type ReplyMessageProps = {
  msg: ChatMessage;
  isLoading: boolean;
};

type MarkdownMessageProps = {
  content: string;
};

type MarkdownChildren = {
  children?: ReactNode;
};

const TYPING_DOT_DELAY_MS = 150;
const TYPING_DOTS = [0, 1, 2];

export const MessageList = ({ messages, isLoading }: MessageListProps) => (
  <div className="space-y-5">
    {messages.map((msg, idx) => (
      <div key={msg.id} className="space-y-1">
        {msg.role === "user" ? (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-foreground px-3.5 py-2.5 text-sm text-background">
              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <AiAvatar size="sm" className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <ReplyMessage msg={msg} isLoading={isLoading && idx === messages.length - 1} />
            </div>
          </div>
        )}
      </div>
    ))}
  </div>
);

const ReplyMessage = ({ msg, isLoading }: ReplyMessageProps) => {
  const [toolsExpanded, setToolsExpanded] = useState(true);
  const doneCount = msg.toolCalls.filter((t) => t.status === "done").length;

  return (
    <div className="space-y-2">
      {msg.toolCalls.length > 0 && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setToolsExpanded((v) => !v)}
            className="flex items-center gap-1 text-2xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {toolsExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            {doneCount}/{msg.toolCalls.length} steps completed
          </button>
          {toolsExpanded && (
            <div className="flex flex-wrap gap-1.5">
              {msg.toolCalls.map((tc, i) => (
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
      ) : isLoading ? (
        <TypingDots />
      ) : (
        <span className="text-xs text-muted-foreground italic">Done</span>
      )}
    </div>
  );
};

const TypingDots = () => (
  <div className="flex items-center gap-1 pt-2">
    {TYPING_DOTS.map((i) => (
      <span
        key={i}
        className="size-1.5 animate-bounce rounded-full bg-muted-foreground opacity-60"
        style={{ animationDelay: `${i * TYPING_DOT_DELAY_MS}ms` }}
      />
    ))}
  </div>
);

const MarkdownMessage = ({ content }: MarkdownMessageProps) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      p: ({ children }: MarkdownChildren) => <p className="my-1 leading-relaxed">{children}</p>,
      ul: ({ children }: MarkdownChildren) => (
        <ul className="my-1.5 ml-4 list-disc space-y-0.5">{children}</ul>
      ),
      ol: ({ children }: MarkdownChildren) => (
        <ol className="my-1.5 ml-4 list-decimal space-y-0.5">{children}</ol>
      ),
      li: ({ children }: MarkdownChildren) => <li className="leading-relaxed">{children}</li>,
      strong: ({ children }: MarkdownChildren) => (
        <strong className="font-semibold">{children}</strong>
      ),
      code: ({ children }: MarkdownChildren) => (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{children}</code>
      ),
    }}
  >
    {content}
  </ReactMarkdown>
);
