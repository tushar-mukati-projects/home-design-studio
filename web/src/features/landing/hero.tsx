"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BlueprintGrid, HeroGradientMesh } from "./backgrounds";
import { EditorMockup } from "./editor-mockup";
import { fadeUp } from "./motion";

const HERO_STAGGER_S = 0.12;

export const Hero = () => (
  <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
    <BlueprintGrid />
    <HeroGradientMesh />
    <div className="pointer-events-none absolute top-24 left-6 size-24 border-t border-l border-primary/10 sm:left-12 sm:size-32" />
    <div className="pointer-events-none absolute right-6 bottom-12 size-24 border-r border-b border-primary/10 sm:right-12 sm:size-32" />

    <div className="relative z-10 mx-auto max-w-5xl text-center">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: HERO_STAGGER_S } } }}
      >
        <motion.div variants={fadeUp} custom={0} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
            Now in Public Beta
          </span>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          custom={1}
          className="font-heading text-4xl leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
        >
          <span className="text-foreground">Design Your</span>
          <br />
          <span className="bg-gradient-to-r from-primary via-muted-foreground to-primary bg-clip-text text-transparent">
            Dream Space
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          custom={2}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl"
        >
          Professional floor plan editor with AI-powered room furnishing
          <br className="hidden sm:block" />
          and real-time 3D preview.
        </motion.p>
        <motion.div
          variants={fadeUp}
          custom={3}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 gap-2 px-8 text-base font-semibold shadow-lg shadow-primary/20",
            )}
          >
            Start Designing
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
        <EditorMockup />
      </motion.div>
    </div>
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-background to-transparent" />
  </section>
);
