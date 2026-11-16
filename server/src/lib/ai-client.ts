import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { config } from "./config";
import { httpError } from "./http-error";

const AI_MODEL = "gpt-4o";
export const AI_TIMEOUT_MS = 60_000;
export const AI_MAX_RETRIES = 1;

export const languageModel = (): LanguageModel => {
  if (!config.openaiApiKey) throw httpError(503, "AI_NOT_CONFIGURED");
  return createOpenAI({ apiKey: config.openaiApiKey })(AI_MODEL);
};
