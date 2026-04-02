"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFetchPlan } from "@/hooks/billing";

interface PlanBadgeProps {
  onClick?: () => void;
}

export const PlanBadge = ({ onClick }: PlanBadgeProps) => {
  const { data } = useFetchPlan();

  if (!data) return null;

  const isPro = data.plan === "pro";

  return (
    <Badge
      variant={isPro ? "default" : "secondary"}
      className={`cursor-pointer gap-1 text-xs font-medium ${
        isPro
          ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
      }`}
      onClick={onClick}
    >
      {isPro && <Sparkles className="h-3 w-3" />}
      {isPro ? "Pro" : "Free"}
    </Badge>
  );
};
