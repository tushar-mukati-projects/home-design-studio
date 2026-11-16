import { describe, test, expect } from "bun:test";
import { createDesignGate, planUsageLabel } from "@/features/dashboard/lib/plan-gate";
import type { Plan } from "@/types";

const plan = (overrides: Partial<Plan>): Plan => ({
  plan: "free",
  canCreateDesign: true,
  canShare: false,
  canUseAI: false,
  designLimit: 3,
  designCount: 0,
  status: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  ...overrides,
});

describe("createDesignGate", () => {
  test.each([
    ["the plan is still loading", "pending", undefined, "checking"],
    ["the plan request failed", "error", undefined, "unavailable"],
    ["the server allows another design", "success", plan({ designCount: 2 }), "open"],
    [
      "the server says the limit is reached",
      "success",
      plan({ canCreateDesign: false, designCount: 3 }),
      "limit",
    ],
    [
      "a pro plan with many designs",
      "success",
      plan({ plan: "pro", designLimit: null, designCount: 80 }),
      "open",
    ],
  ] as const)("%s", (_label, status, data, expected) => {
    expect(createDesignGate({ status, data })).toBe(expected);
  });
});

describe("planUsageLabel", () => {
  test.each([
    [undefined, "…"],
    [plan({ designCount: 2, designLimit: 3 }), "2/3"],
    [plan({ plan: "pro", designCount: 80, designLimit: null }), "∞"],
  ])("renders %j as %s", (input, expected) => {
    expect(planUsageLabel(input)).toBe(expected);
  });
});
