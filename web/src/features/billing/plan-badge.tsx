"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import { cn } from "@/lib/utils";
import type { PlanName } from "@/shared/canvas";

type PlanBadgeProps = {
  onClick: () => void;
};

export const PLAN_LABELS = { free: "Free", pro: "Pro" } satisfies Record<PlanName, string>;

export const PlanBadge = ({ onClick }: PlanBadgeProps) => {
  const { data } = useFetchPlan();

  if (!data) return null;

  const isPro = data.plan === "pro";

  return (
    <Badge
      variant={isPro ? "default" : "secondary"}
      className={cn(
        "cursor-pointer gap-1 text-xs font-medium",
        isPro
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      {isPro && <Sparkles className="size-3" />}
      {PLAN_LABELS[data.plan]}
    </Badge>
  );
};
