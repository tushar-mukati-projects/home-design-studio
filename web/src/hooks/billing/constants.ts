export const BILLING_API_ROUTES = {
  checkout: "/billing/checkout",
  portal: "/billing/portal",
  plan: "/billing/plan",
} as const;

export const BILLING_QUERY_KEYS = {
  plan: ["billing", "plan"] as const,
};
