import type { PlanName } from "@/shared/canvas";
import type { Plan } from "@/types";

export type PlanCtaInput = {
  tier: PlanName;
  signedIn: boolean;
  plan: Plan | undefined;
};

export type PlanCta = "sign-up" | "checking" | "current" | "upgrade" | "none";

export const planCta = ({ tier, signedIn, plan }: PlanCtaInput): PlanCta => {
  if (!signedIn) return "sign-up";
  if (plan === undefined) return "checking";
  if (plan.plan === tier) return "current";
  return tier === "pro" ? "upgrade" : "none";
};
