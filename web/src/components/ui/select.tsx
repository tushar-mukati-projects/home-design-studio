"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Select = ({
  value: controlledValue,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select...",
  disabled = false,
  className,
}: SelectProps) => {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : uncontrolledValue;
  const selectedOption = options.find((o) => o.value === currentValue);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(optionValue);
    }
    onValueChange?.(optionValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-sm shadow-sm transition-colors",
          "placeholder:text-[var(--muted-foreground)]",
          "focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-1 focus:ring-offset-[var(--background)] focus:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption && "text-[var(--muted-foreground)]",
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute z-50 mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--popover)] p-1 shadow-md duration-100">
          {options.map((option) => (
            <div
              key={option.value}
              className={cn(
                "relative flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none",
                "hover:bg-[var(--secondary)] hover:text-[var(--secondary-foreground)]",
                option.disabled && "pointer-events-none opacity-50",
                option.value === currentValue && "bg-[var(--secondary)]",
              )}
              onClick={() => !option.disabled && handleSelect(option.value)}
            >
              <span className="flex-1">{option.label}</span>
              {option.value === currentValue && <Check className="h-4 w-4 text-[var(--primary)]" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export { Select, type SelectOption };
