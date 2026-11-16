"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { fadeUp } from "./motion";

type AnimatedSectionProps = {
  children: React.ReactNode;
  id?: string;
};

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className: string;
};

const IN_VIEW_MARGIN = "-80px";
const STAGGER_S = 0.1;

export const AnimatedSection = ({ children, id }: AnimatedSectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: IN_VIEW_MARGIN });

  return (
    <section
      ref={ref}
      id={id}
      className="relative px-4 py-24 will-change-[opacity] sm:px-6 sm:py-32 lg:px-8"
    >
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{ visible: { transition: { staggerChildren: STAGGER_S } } }}
      >
        {children}
      </motion.div>
    </section>
  );
};

export const SectionHeading = ({ eyebrow, title, description, className }: SectionHeadingProps) => (
  <div className={className}>
    <motion.p
      variants={fadeUp}
      custom={0}
      className="mb-3 text-sm font-semibold tracking-[0.2em] text-primary uppercase"
    >
      {eyebrow}
    </motion.p>
    <motion.h2
      variants={fadeUp}
      custom={1}
      className="font-heading text-3xl tracking-tight sm:text-4xl md:text-5xl"
    >
      {title}
    </motion.h2>
    {description && (
      <motion.p
        variants={fadeUp}
        custom={2}
        className="mx-auto mt-4 max-w-xl text-muted-foreground"
      >
        {description}
      </motion.p>
    )}
  </div>
);

export const SectionDivider = () => (
  <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
);
