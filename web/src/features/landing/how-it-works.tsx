"use client";

import { motion, type Variants } from "framer-motion";
import { AnimatedSection, SectionHeading } from "./animated-section";
import { fadeUp, slideInLeft, slideInRight } from "./motion";
import { StepIllustration, type StepNumber } from "./step-illustration";

type Step = {
  step: StepNumber;
  title: string;
  description: string;
  variants: Variants;
};

const STEPS: Step[] = [
  {
    step: 1,
    title: "Draw Your Layout",
    description: "Sketch walls and define rooms with intuitive drawing tools on a precise grid.",
    variants: slideInLeft,
  },
  {
    step: 2,
    title: "Furnish & Customize",
    description:
      "Drag furniture from the catalog, adjust dimensions, and arrange until it feels right.",
    variants: fadeUp,
  },
  {
    step: 3,
    title: "Preview in 3D",
    description:
      "Walk through your design in an immersive 3D view and see your space from every angle.",
    variants: slideInRight,
  },
];

export const HowItWorks = () => (
  <AnimatedSection>
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/2 blur-3xl" />
    </div>

    <div className="mx-auto max-w-6xl">
      <SectionHeading
        className="mb-20 text-center"
        eyebrow="How It Works"
        title="Three Steps to Your Dream Home"
      />
      <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
        <div className="pointer-events-none absolute top-22 right-0 left-0 hidden md:block">
          <div className="mx-auto h-px max-w-[70%] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute top-1/2 left-[33%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30" />
          <div className="absolute top-1/2 left-[66%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30" />
        </div>
        <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-primary/10 to-transparent md:hidden" />
        {STEPS.map((step, i) => (
          <motion.div
            key={step.step}
            variants={step.variants}
            custom={i}
            className="relative text-center"
          >
            <span className="mb-4 block font-heading text-5xl text-primary/20 md:text-6xl">
              {String(step.step).padStart(2, "0")}
            </span>
            <StepIllustration step={step.step} />
            <h3 className="mt-6 font-heading text-xl text-foreground">{step.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </AnimatedSection>
);
