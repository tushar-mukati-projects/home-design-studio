"use client";

import { useEffect, useState } from "react";
import { getApiErrorMessage } from "./api-error";
import { MOCKS_ENABLED } from "./env";

export const useMswReady = () => {
  const [ready, setReady] = useState(!MOCKS_ENABLED);
  const [startError, setStartError] = useState<Error | null>(null);

  useEffect(() => {
    if (!MOCKS_ENABLED) return;
    import("@/mocks/browser")
      .then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" }))
      .then(
        () => setReady(true),
        (reason: unknown) =>
          setStartError(new Error(`Mock API failed to start: ${getApiErrorMessage(reason)}`)),
      );
  }, []);

  if (startError) throw startError;
  return ready;
};
