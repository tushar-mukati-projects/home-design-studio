import { MutationCache, QueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getApiErrorMessage } from "./api-error";

const STALE_TIME_MS = 60 * 1000;
const GC_TIME_MS = 5 * 60 * 1000;
const MAX_QUERY_RETRIES = 1;
const RETRY_DELAY_BASE_MS = 1000;
const RETRY_DELAY_MAX_MS = 10_000;
const FIRST_SERVER_ERROR_STATUS = 500;

export const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (failureCount >= MAX_QUERY_RETRIES || !axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status >= FIRST_SERVER_ERROR_STATUS;
};

export const makeQueryClient = () =>
  new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: false,
        retry: shouldRetryQuery,
        retryDelay: (attempt) => Math.min(RETRY_DELAY_BASE_MS * 2 ** attempt, RETRY_DELAY_MAX_MS),
      },
      mutations: { retry: false },
    },
  });

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
