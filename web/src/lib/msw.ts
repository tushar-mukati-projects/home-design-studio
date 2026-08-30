"use client";

import { useEffect, useState } from "react";

const ENABLE_MOCKS = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";

export const useMswReady = () => {
  const [ready, setReady] = useState(!ENABLE_MOCKS);

  useEffect(() => {
    if (!ENABLE_MOCKS) return;
    let cancelled = false;
    import("@/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .catch((err) => {
        console.error("[MSW] failed to start, falling back to real API", err);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
};
