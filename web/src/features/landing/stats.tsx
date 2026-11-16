"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { AnimatedSection } from "./animated-section";
import { fadeUp } from "./motion";

type Stat = {
  value: number;
  prefix: string;
  suffix: string;
  label: string;
};

type AnimatedCounterProps = {
  target: number;
  suffix: string;
};

const COUNT_DURATION_S = 2;
const IN_VIEW_MARGIN = "-40px";

const STATS: Stat[] = [
  { value: 10000, prefix: "", suffix: "+", label: "Designs Created" },
  { value: 25, prefix: "", suffix: "+", label: "Furniture Items" },
  { value: 60, prefix: "", suffix: " FPS", label: "Real-time 3D" },
  { value: 0, prefix: "$", suffix: "", label: "Cost to Start" },
];

export const Stats = () => (
  <AnimatedSection>
    <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
      {STATS.map((stat, i) => (
        <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
          <p className="font-heading text-3xl text-foreground sm:text-4xl md:text-5xl">
            {stat.value === 0 ? (
              `${stat.prefix}0`
            ) : (
              <AnimatedCounter target={stat.value} suffix={stat.suffix} />
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </AnimatedSection>
);

const AnimatedCounter = ({ target, suffix }: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: IN_VIEW_MARGIN });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / 1000 / COUNT_DURATION_S, 1);
      setCount(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};
