import { describe, test, expect } from "bun:test";
import { planCta } from "@/features/billing/lib/plan-cta";
import type { Plan } from "@/types";

const plan = (name: Plan["plan"]): Plan => ({
  plan: name,
  canCreateDesign: true,
  canShare: name === "pro",
  canUseAI: name === "pro",
  designLimit: name === "pro" ? null : 3,
  designCount: 1,
  status: name === "pro" ? "active" : null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
});

describe("planCta", () => {
  test.each([
    ["signed out, free card", "free", false, undefined, "sign-up"],
    ["signed out, pro card", "pro", false, undefined, "sign-up"],
    ["signed in, plan loading, free card", "free", true, undefined, "checking"],
    ["signed in, plan loading, pro card", "pro", true, undefined, "checking"],
    ["free user, free card", "free", true, plan("free"), "current"],
    ["free user, pro card", "pro", true, plan("free"), "upgrade"],
    ["pro user, pro card", "pro", true, plan("pro"), "current"],
    ["pro user, free card", "free", true, plan("pro"), "none"],
  ] as const)("%s", (_label, tier, signedIn, data, expected) => {
    expect(planCta({ tier, signedIn, plan: data })).toBe(expected);
  });
});
