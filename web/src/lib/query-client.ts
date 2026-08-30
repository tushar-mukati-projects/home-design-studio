import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "./api-error";

export const makeQueryClient = () => {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        if (mutation.meta?.skipErrorToast) return;
        toast.error(getApiErrorMessage(error));
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
      mutations: {
        retry: 0,
      },
    },
  });
};

let browserQueryClient: QueryClient | undefined;

export const getQueryClient = () => {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
};
