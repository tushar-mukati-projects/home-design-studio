import { Check, Database, Eye, Loader2, PencilRuler, Save } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ToolCall } from "./use-design-chat";

type ToolConfig = {
  label: string;
  icon: ReactNode;
};

type ToolPillProps = {
  tool: ToolCall;
};

const TOOL_CONFIG: Record<string, ToolConfig> = {
  fetch_canvas: { label: "Reading the plan", icon: <Database className="size-3" /> },
  set_canvas: { label: "Building layout", icon: <PencilRuler className="size-3" /> },
  edit_canvas: { label: "Editing the plan", icon: <PencilRuler className="size-3" /> },
  review_canvas: { label: "Reviewing layout", icon: <Eye className="size-3" /> },
  save_canvas: { label: "Saving design", icon: <Save className="size-3" /> },
};

const UNKNOWN_TOOL: ToolConfig = {
  label: "Working on the plan",
  icon: <PencilRuler className="size-3" />,
};

export const toolConfig = (name: string): ToolConfig => TOOL_CONFIG[name] ?? UNKNOWN_TOOL;

export const ToolPill = ({ tool }: ToolPillProps) => {
  const config = toolConfig(tool.name);
  const done = tool.status === "done";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground transition-all",
        done && "opacity-60",
      )}
    >
      {done ? <Check className="size-3" /> : <Loader2 className="size-3 animate-spin" />}
      {config.icon}
      {config.label}
    </span>
  );
};
