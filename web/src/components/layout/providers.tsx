"use client";

import { Suspense } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useMswReady } from "@/lib/msw";
import { getQueryClient } from "@/lib/query-client";
import { RouteProgress } from "./route-progress";

const TOAST_DURATION_MS = 3000;
const TOAST_CLASS_NAMES = { toast: "border-border! bg-card! text-foreground!" };

type ProvidersProps = {
  children: React.ReactNode;
};

export const Providers = ({ children }: ProvidersProps) => {
  const queryClient = getQueryClient();
  const mswReady = useMswReady();

  if (!mswReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <RouteProgress />
      </Suspense>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ classNames: TOAST_CLASS_NAMES, duration: TOAST_DURATION_MS }}
      />
    </QueryClientProvider>
  );
};
