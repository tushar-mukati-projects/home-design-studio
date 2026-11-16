import axios from "axios";
import { z } from "zod";

const STATUS_FALLBACKS: Record<number, string> = {
  401: "Your session has ended. Sign in again to continue.",
  403: "You do not have permission to do that.",
  404: "That item no longer exists.",
  413: "That file is too large.",
  429: "Too many requests. Please wait a moment and try again.",
  503: "Something is not working on our side. Try again in a few seconds.",
};

const OFFLINE_MESSAGE = "We can't connect right now. Check your connection and try again.";

export const errorBodySchema = z.object({ error: z.string().trim().min(1) });

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong."): string => {
  if (axios.isAxiosError(error)) {
    const body = errorBodySchema.safeParse(error.response?.data);
    if (body.success) return body.data.error;

    const status = error.response?.status;
    if (status && STATUS_FALLBACKS[status]) return STATUS_FALLBACKS[status];
    if (!error.response) return OFFLINE_MESSAGE;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};
