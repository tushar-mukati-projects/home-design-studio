import axios from "axios";

const STATUS_FALLBACKS: Record<number, string> = {
  401: "Your session has ended. Sign in again to continue.",
  403: "You do not have permission to do that.",
  404: "That item no longer exists.",
  413: "That file is too large.",
  429: "Too many requests. Please wait a moment and try again.",
  503: "Something is not working on our side. Try again in a few seconds.",
};

export const getApiErrorMessage = (error: unknown, fallback = "Something went wrong."): string => {
  if (axios.isAxiosError(error)) {
    const serverMessage = (error.response?.data as { error?: unknown } | undefined)?.error;
    if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;

    const status = error.response?.status;
    if (status && STATUS_FALLBACKS[status]) return STATUS_FALLBACKS[status];
    if (!error.response) return "We can't connect right now. Check your connection and try again.";
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

export const sessionErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "We can't connect right now. Check your connection, then try again.";
    }
    if (error.response.status === 401) {
      return "Your session has ended. Sign in again to continue.";
    }
    if (error.response.status === 503) {
      return "Something is not working on our side. Give it a few seconds and try again.";
    }
  }
  return `We couldn't load your account. ${getApiErrorMessage(error)}`;
};
