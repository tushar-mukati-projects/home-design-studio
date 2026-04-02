"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delayDuration?: number;
  className?: string;
}

const Tooltip = ({
  children,
  content,
  side = "top",
  delayDuration = 300,
  className,
}: TooltipProps) => {
  const [visible, setVisible] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delayDuration);
  };

  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  };

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "animate-in fade-in-0 zoom-in-95 absolute z-50 rounded-md border border-[var(--border)] bg-[var(--popover)] px-3 py-1.5 text-xs whitespace-nowrap text-[var(--popover-foreground)] shadow-md duration-100",
            positionClasses[side],
            className,
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export { Tooltip };
