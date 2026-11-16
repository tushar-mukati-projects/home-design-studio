"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { QueryError } from "@/components/ui/query-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { PLANS, type PlanName } from "@/shared/canvas";
import type { Plan } from "@/types";
import { planCta } from "./lib/plan-cta";
import { PLAN_LABELS } from "./plan-badge";
import { UpgradeButton } from "./upgrade-button";

type PlanTier = {
  tier: PlanName;
  price: string;
  period: string;
  description: string;
  features: string[];
  signUpLabel: string;
};

type PlanCardProps = {
  tier: PlanTier;
  signedIn: boolean;
  plan: Plan | undefined;
};

type FaqItemProps = {
  question: string;
  answer: string;
};

const PLAN_TIERS: PlanTier[] = [
  {
    tier: "free",
    price: "$0",
    period: "forever",
    description: "Get started with basic floor plan design",
    features: [
      `Up to ${PLANS.free.designLimit} designs`,
      "2D floor plan editor",
      "Full furniture catalog",
      "3D preview",
      "PNG and PDF export",
      "Versions",
    ],
    signUpLabel: "Get Started Free",
  },
  {
    tier: "pro",
    price: "$12",
    period: "/month",
    description: "Everything you need for professional home design",
    features: [
      "Everything in Free",
      "Unlimited designs",
      "Design AI chat",
      "AI room furnishing",
      "Import a floor plan from a photo",
      "Share with view or edit access",
      "Real-time collaboration",
    ],
    signUpLabel: "Get Started",
  },
];

const FAQS: FaqItemProps[] = [
  {
    question: "Can I try Pro before paying?",
    answer: `Yes — the Free plan gives you up to ${PLANS.free.designLimit} designs with full editor access so you can evaluate the tool. Upgrade to Pro when you need unlimited designs, Design AI, and sharing.`,
  },
  {
    question: "What happens to my designs if I downgrade?",
    answer: `Your designs are never deleted. If you downgrade to Free, you can still view and edit your existing designs — you just won't be able to create new ones beyond the ${PLANS.free.designLimit}-design limit.`,
  },
  {
    question: "How does billing work?",
    answer:
      "Pro is billed monthly at $12/month. You can cancel at any time and your access continues until the end of the billing period. All payments are securely processed by Stripe.",
  },
  {
    question: "Is real-time collaboration included in Pro?",
    answer:
      "Yes. Pro includes real-time multiplayer collaboration so multiple people can work on the same design simultaneously, with live cursor tracking and synced edits.",
  },
  {
    question: "What export formats are available?",
    answer: "All plans can export floor plans as PNG or PDF, or print them directly.",
  },
];

export const PricingView = () => {
  const { user } = useAuth();
  const plan = useFetchPlan();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that fits your design needs
          </p>
        </div>

        {plan.isError && (
          <QueryError
            className="mt-10"
            error={plan.error}
            onRetry={() => plan.refetch()}
            retrying={plan.isFetching}
          />
        )}

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {PLAN_TIERS.map((tier) => (
            <PlanCard key={tier.tier} tier={tier} signedIn={user !== null} plan={plan.data} />
          ))}
        </div>

        <p className="mt-16 text-center text-sm text-muted-foreground">
          All plans include a 14-day money-back guarantee. Cancel anytime.
        </p>

        <div className="mt-24">
          <h2 className="mb-8 text-center font-heading text-2xl font-semibold text-foreground">
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card px-6 shadow-sm">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PlanCard = ({ tier, signedIn, plan }: PlanCardProps) => {
  const highlighted = tier.tier === "pro";
  const cta = planCta({ tier: tier.tier, signedIn, plan });

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-card p-6 transition-shadow sm:p-8",
        highlighted ? "border-primary shadow-xl" : "border-border",
      )}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-heading text-xl font-semibold text-foreground">
          {PLAN_LABELS[tier.tier]}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{tier.description}</p>
      </div>

      <div className="mb-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-foreground">{tier.price}</span>
        <span className="text-sm text-muted-foreground">{tier.period}</span>
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>

      {cta === "sign-up" && (
        <Link
          href="/sign-up"
          className={cn(buttonVariants({ variant: highlighted ? "default" : "outline" }), "w-full")}
        >
          {tier.signUpLabel}
        </Link>
      )}
      {cta === "checking" && <Skeleton className="h-9 w-full" />}
      {cta === "current" && (
        <Button variant="outline" className="w-full" disabled>
          Current Plan
        </Button>
      )}
      {cta === "upgrade" && <UpgradeButton />}
    </div>
  );
};

const FaqItem = ({ question, answer }: FaqItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-foreground">{question}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
    </div>
  );
};
