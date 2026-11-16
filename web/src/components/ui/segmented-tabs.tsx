import { cn } from "@/lib/utils";

export type SegmentedTab<T extends string> = {
  value: T;
  label: React.ReactNode;
};

type SegmentedTabsProps<T extends string> = {
  tabs: readonly SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  tabClassName?: string;
};

export const SegmentedTabs = <T extends string>({
  tabs,
  value,
  onChange,
  className,
  tabClassName,
}: SegmentedTabsProps<T>) => (
  <div className={cn("flex gap-1 rounded-md border border-border p-1", className)}>
    {tabs.map((tab) => (
      <button
        key={tab.value}
        type="button"
        onClick={() => onChange(tab.value)}
        className={cn(
          "rounded-sm px-3 py-1.5 text-sm transition-colors",
          value === tab.value
            ? "bg-secondary text-foreground"
            : "text-muted-foreground hover:text-foreground",
          tabClassName,
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);
