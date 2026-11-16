import { CHAT_MAX_MESSAGES, CHAT_MAX_TOTAL_CHARS } from "@/shared/canvas";

export type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export const recentHistory = (messages: HistoryMessage[]): HistoryMessage[] => {
  const kept: HistoryMessage[] = [];
  let chars = 0;
  for (const message of messages.toReversed()) {
    chars += message.content.length;
    if (kept.length === CHAT_MAX_MESSAGES || chars > CHAT_MAX_TOTAL_CHARS) break;
    kept.unshift(message);
  }
  return kept;
};
