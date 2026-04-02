"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { useCreateCheckout } from "@/hooks/billing";
import { useFetchPlan } from "@/hooks/billing";
import { useAuth } from "@/lib/auth-context";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic floor plan design",
    features: [
      "Up to 3 designs",
      "2D floor plan editor",
      "Basic furniture catalog",
      "PNG export",
      "Community support",
    ],
    cta: "Current Plan",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/month",
    description: "Everything you need for professional home design",
    features: [
      "Unlimited designs",
      "3D preview & walkthrough",
      "Full furniture catalog",
      "PDF & SVG export",
      "Real-time collaboration",
      "Version history",
      "Share & embed designs",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
];

const faqs = [
  {
    question: "Can I try Pro before paying?",
    answer:
      "Yes — the Free plan gives you up to 3 designs with full editor access so you can evaluate the tool. Upgrade to Pro when you need unlimited designs, 3D walkthrough, and collaboration.",
  },
  {
    question: "What happens to my designs if I downgrade?",
    answer:
      "Your designs are never deleted. If you downgrade to Free, you can still view and edit your existing designs — you just won't be able to create new ones beyond the 3-design limit.",
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
    answer:
      "Free plan supports PNG export. Pro unlocks PDF and SVG exports, which preserve vector quality for printing or sharing with contractors.",
  },
];

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem = ({ question, answer }: FaqItemProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)] last:border-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="text-sm font-medium text-[var(--foreground)]">{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed text-[var(--muted-foreground)]">{answer}</p>
      )}
    </div>
  );
};

const PricingPage = () => {
  const { user } = useAuth();
  const { data: planData } = useFetchPlan();
  const { mutate: createCheckout, isPending } = useCreateCheckout();

  const currentPlan = planData?.plan || "free";

  const handleUpgrade = () => {
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
    if (priceId) {
      createCheckout({ priceId });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1
            className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-[var(--muted-foreground)]">
            Choose the plan that fits your design needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {plans.map((plan) => {
            const isCurrentPlan =
              (plan.name === "Free" && currentPlan === "free") ||
              (plan.name === "Pro" && currentPlan === "pro");

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 transition-shadow sm:p-8 ${
                  plan.highlighted
                    ? "border-[var(--primary)] bg-[var(--card)] shadow-xl"
                    : "border-[var(--border)] bg-[var(--card)]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-semibold text-[var(--primary-foreground)]">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className="text-xl font-semibold text-[var(--foreground)]"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[var(--foreground)]">{plan.price}</span>
                  <span className="text-sm text-[var(--muted-foreground)]">{plan.period}</span>
                </div>

                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span className="text-sm text-[var(--foreground)]">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.highlighted && user ? (
                  <Button
                    className="w-full"
                    onClick={handleUpgrade}
                    disabled={isPending}
                  >
                    {isPending ? "Loading..." : plan.cta}
                  </Button>
                ) : plan.highlighted ? (
                  <a href="/sign-up">
                    <Button className="w-full">Get Started</Button>
                  </a>
                ) : (
                  <a href="/sign-up">
                    <Button variant="outline" className="w-full">Get Started Free</Button>
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-[var(--muted-foreground)]">
            All plans include a 14-day money-back guarantee. Cancel anytime.
          </p>
        </div>

        <div className="mt-24">
          <h2
            className="mb-8 text-center text-2xl font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--card)] px-6 shadow-sm">
            {faqs.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
