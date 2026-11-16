"use client";

import { Crown, Layers, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LABELS, PlanBadge } from "@/features/billing/plan-badge";
import type { Plan } from "@/types";
import { planUsageLabel } from "./lib/plan-gate";

type DashboardHeaderProps = {
  total: number | undefined;
  sharedTotal: number | undefined;
  plan: Plan | undefined;
  onCreate: () => void;
  onPlanClick: () => void;
};

type StatCardProps = {
  icon: React.ReactNode;
  value: string;
  label: string;
};

const countLabel = (count: number | undefined) => (count === undefined ? "…" : String(count));

export const DashboardHeader = ({
  total,
  sharedTotal,
  plan,
  onCreate,
  onPlanClick,
}: DashboardHeaderProps) => (
  <>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl text-foreground">My Designs</h1>
        <PlanBadge onClick={onPlanClick} />
      </div>
      <Button onClick={onCreate} className="w-full sm:w-auto">
        <Plus />
        Create New Design
      </Button>
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard icon={<Layers />} value={countLabel(total)} label="Total Designs" />
      <StatCard icon={<Crown />} value={planUsageLabel(plan)} label="Plan Usage" />
      <StatCard icon={<Users />} value={countLabel(sharedTotal)} label="Shared with Me" />
      <StatCard
        icon={<Crown />}
        value={plan === undefined ? "…" : PLAN_LABELS[plan.plan]}
        label="Current Plan"
      />
    </div>
  </>
);

const StatCard = ({ icon, value, label }: StatCardProps) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground [&_svg]:size-4">
      {icon}
    </div>
    <div>
      <p className="text-lg leading-tight font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);
