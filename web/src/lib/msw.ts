"use client";

import { useEffect, useState } from "react";

const ENABLE_MOCKS = process.env.NEXT_PUBLIC_ENABLE_MOCKS === "true";

export const useMswReady = () => {
  const [ready, setReady] = useState(!ENABLE_MOCKS);

  useEffect(() => {
    if (!ENABLE_MOCKS) return;
    import("@/mocks/browser").then(({ worker }) => {
      worker.start({ onUnhandledRequest: "bypass" }).then(() => {
        setReady(true);
      });
    });
  }, []);

  return ready;
};
