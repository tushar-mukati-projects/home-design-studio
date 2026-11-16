"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

const PROGRESS_SPEED_MS = 400;

NProgress.configure({ showSpinner: false, easing: "ease", speed: PROGRESS_SPEED_MS });

export const RouteProgress = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
};
