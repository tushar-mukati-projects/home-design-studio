"use client";

import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { AnimatedSection, SectionDivider, SectionHeading } from "./animated-section";
import { INK, MUTED_INK, gridLines } from "./landing-colors";
import { scaleIn } from "./motion";

type ShowcaseItem = {
  name: string;
  dimensions: string;
  gradientFrom: string;
  accent: string;
};

type ShowcaseCardProps = ShowcaseItem & { index: number };

const SHOWCASE_GRID_PX = 20;

const SHOWCASE: ShowcaseItem[] = [
  { name: "Modern Living Room", dimensions: "5.2m x 3.8m", gradientFrom: INK, accent: INK },
  {
    name: "Minimalist Bedroom",
    dimensions: "4.0m x 3.5m",
    gradientFrom: "var(--secondary-foreground)",
    accent: MUTED_INK,
  },
  { name: "Open Kitchen", dimensions: "6.0m x 4.2m", gradientFrom: MUTED_INK, accent: MUTED_INK },
];

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export const Showcase = () => (
  <AnimatedSection>
    <SectionDivider />
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        className="mb-16 text-center"
        eyebrow="Showcase"
        title="See What's Possible"
        description="From cozy bedrooms to open-concept kitchens, bring any vision to life."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SHOWCASE.map((item, i) => (
          <ShowcaseCard key={item.name} index={i} {...item} />
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const ShowcaseCard = ({ name, dimensions, gradientFrom, accent, index }: ShowcaseCardProps) => (
  <motion.div
    variants={scaleIn}
    custom={index}
    className="group relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-500 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/10"
  >
    <div
      className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
      style={{
        background: `linear-gradient(135deg, ${tint(gradientFrom, 8)} 0%, var(--foreground) 40%, ${INK} 100%)`,
      }}
    />
    <div
      className="absolute inset-0 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]"
      style={{ backgroundImage: gridLines(accent, SHOWCASE_GRID_PX) }}
    />
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.2]"
      viewBox="0 0 400 300"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      {index === 0 && <LivingRoomPlan accent={accent} />}
      {index === 1 && <BedroomPlan accent={accent} />}
      {index === 2 && <KitchenPlan accent={accent} />}
    </svg>
    <div
      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{
        background: `radial-gradient(ellipse at center, ${tint(accent, 3)}, transparent 70%)`,
      }}
    />
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent p-6">
      <div className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
        <p className="font-heading text-lg text-foreground">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dimensions}</p>
        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          View design <ChevronRight className="size-3" />
        </div>
      </div>
    </div>
  </motion.div>
);

type PlanArtProps = {
  accent: string;
};

const LivingRoomPlan = ({ accent }: PlanArtProps) => (
  <>
    <rect x="60" y="40" width="280" height="220" stroke={accent} strokeWidth="2" />
    <line x1="200" y1="40" x2="200" y2="160" stroke={accent} strokeWidth="1.5" />
    <rect x="80" y="180" width="90" height="40" rx="4" fill={accent} opacity={0.3} />
    <rect x="230" y="70" width="60" height="80" rx="3" fill={accent} opacity={0.2} />
    <circle cx="130" cy="100" r="20" fill={accent} opacity={0.15} />
  </>
);

const BedroomPlan = ({ accent }: PlanArtProps) => (
  <>
    <rect x="50" y="30" width="300" height="240" stroke={accent} strokeWidth="2" />
    <rect x="70" y="50" width="120" height="90" rx="4" fill={accent} opacity={0.25} />
    <rect x="250" y="60" width="70" height="50" rx="3" fill={accent} opacity={0.15} />
    <rect x="250" y="180" width="80" height="60" rx="3" fill={accent} opacity={0.12} />
    <circle cx="130" cy="200" r="25" fill={accent} opacity={0.1} />
  </>
);

const KITCHEN_CHAIRS = [
  [220, 90],
  [250, 90],
  [280, 90],
  [220, 160],
  [250, 160],
  [280, 160],
];

const KitchenPlan = ({ accent }: PlanArtProps) => (
  <>
    <rect x="40" y="30" width="320" height="240" stroke={accent} strokeWidth="2" />
    <line
      x1="180"
      y1="30"
      x2="180"
      y2="270"
      stroke={accent}
      strokeWidth="1.5"
      strokeDasharray="6 4"
    />
    <rect x="55" y="45" width="110" height="20" rx="2" fill={accent} opacity={0.3} />
    <rect x="55" y="45" width="20" height="200" rx="2" fill={accent} opacity={0.25} />
    <rect x="200" y="100" width="80" height="50" rx="4" fill={accent} opacity={0.2} />
    {KITCHEN_CHAIRS.map(([cx, cy]) => (
      <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="8" fill={accent} opacity={0.12} />
    ))}
  </>
);
