import type { Plan } from "@/types";

export type PlanQueryState = {
  status: "pending" | "error" | "success";
  data: Plan | undefined;
};

export type CreateGate = "checking" | "unavailable" | "open" | "limit";

export const createDesignGate = ({ status, data }: PlanQueryState): CreateGate => {
  if (status === "error") return "unavailable";
  if (data === undefined) return "checking";
  return data.canCreateDesign ? "open" : "limit";
};

export const planUsageLabel = (plan: Plan | undefined): string => {
  if (plan === undefined) return "…";
  if (plan.designLimit === null) return "∞";
  return `${plan.designCount}/${plan.designLimit}`;
};
