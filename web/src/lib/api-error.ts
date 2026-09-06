import axios from "axios";

const STATUS_FALLBACKS: Record<number, string> = {
  401: "Your session expired. Please sign in again.",
  403: "You do not have permission to do that.",
  404: "That item no longer exists.",
  413: "That file is too large.",
  429: "Too many requests. Please wait a moment and try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong."): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;

    const status = error.response?.status;
    if (status && STATUS_FALLBACKS[status]) return STATUS_FALLBACKS[status];
    if (!error.response) return "Cannot reach the server. Check your connection.";
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// For the screen that gates the whole app: says what to do, not just what happened.
export const sessionErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Cannot reach the server. Make sure it is running on port 4000, then retry.";
    }
    if (error.response.status === 401) {
      return "Your session is no longer valid. Sign out and sign in again.";
    }
    if (error.response.status === 503) {
      return "The server is up but cannot reach its database right now. Retry in a moment.";
    }
  }
  return `Could not load your account. ${getApiErrorMessage(error)}`;
};
