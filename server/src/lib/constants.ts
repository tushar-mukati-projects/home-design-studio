interface PlanConfig {
  designLimit: number;
  canShare: boolean;
  canUseAI: boolean;
}

export const PLANS: Record<string, PlanConfig> = {
  free: { designLimit: 3, canShare: false, canUseAI: false },
  pro: { designLimit: Infinity, canShare: true, canUseAI: true },
};
