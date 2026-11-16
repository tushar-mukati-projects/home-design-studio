"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnimatedSection } from "./animated-section";
import { fadeUp } from "./motion";

const RINGS = [
  "size-125 rounded-full border-primary/4",
  "absolute size-175 rounded-full border-primary/3",
  "absolute size-225 rounded-full border-primary/2",
  "absolute size-75 rotate-45 border-primary/3",
  "absolute size-112.5 rotate-45 border-primary/2",
];

export const CallToAction = () => (
  <AnimatedSection>
    <div className="mx-auto max-w-4xl text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        {RINGS.map((ring) => (
          <div key={ring} className={cn("border", ring)} />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 h-125 w-200 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl" />
      </div>

      <motion.div variants={fadeUp} custom={0}>
        <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-primary uppercase">
          Get Started
        </p>
      </motion.div>

      <motion.h2
        variants={fadeUp}
        custom={1}
        className="font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
      >
        Ready to Design
        <br />
        <span className="bg-gradient-to-r from-primary via-muted-foreground to-primary bg-clip-text text-transparent">
          Your Space?
        </span>
      </motion.h2>

      <motion.p
        variants={fadeUp}
        custom={2}
        className="mx-auto mt-6 max-w-lg text-muted-foreground sm:text-lg"
      >
        Join thousands of designers and homeowners who bring their ideas to life.
      </motion.p>

      <motion.div variants={fadeUp} custom={3} className="mt-10">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-14 gap-2 px-10 text-base font-semibold shadow-lg shadow-primary/20 sm:text-lg",
          )}
        >
          Get Started Free
          <ArrowRight className="size-5" />
        </Link>
      </motion.div>
    </div>
  </AnimatedSection>
);
