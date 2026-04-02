"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    { className, value, defaultValue = 0, min = 0, max = 100, step = 1, onValueChange, ...props },
    ref,
  ) => {
    const currentValue = value ?? defaultValue;
    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
      <div className={cn("relative flex w-full touch-none items-center select-none", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={(e) => onValueChange?.(Number(e.target.value))}
          className={cn(
            "h-2 w-full cursor-pointer appearance-none rounded-full",
            "bg-[var(--muted)]",
            "[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--primary)] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:active:scale-95",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[var(--primary)] [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 [&::-moz-range-thumb]:active:scale-95",
            "[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[var(--muted)]",
            "focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] focus-visible:outline-none",
          )}
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, var(--muted) ${percentage}%, var(--muted) 100%)`,
          }}
          {...props}
        />
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
