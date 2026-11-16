"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Armchair,
  Box,
  Download,
  Grid3X3,
  History,
  MessageSquare,
  ScanLine,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { AnimatedSection, SectionDivider, SectionHeading } from "./animated-section";
import { scaleIn } from "./motion";

type Feature = {
  icon: LucideIcon;
  title: string;
  description: string;
};

type FeatureCardProps = Feature & { index: number };

const SPOTLIGHT =
  "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), color-mix(in srgb, var(--primary) 8%, transparent), transparent 70%)";

const FEATURES: Feature[] = [
  {
    icon: Grid3X3,
    title: "2D Floor Plan Editor",
    description:
      "Draw walls, place doors and windows with snap-to-grid precision. Intuitive tools that feel natural from the first click.",
  },
  {
    icon: ScanLine,
    title: "Rooms & Areas",
    description: "Name rooms, colour them by type, and see live floor area in m² as you draw.",
  },
  {
    icon: Armchair,
    title: "Furniture Catalog",
    description:
      "25+ real-dimension furniture items across 5 room categories. Every piece scaled to real-world measurements.",
  },
  {
    icon: Box,
    title: "3D Walkthrough",
    description:
      "See your design come to life with real-time 3D preview. Walk through your space from any angle.",
  },
  {
    icon: MessageSquare,
    title: "Design AI",
    description:
      "Describe changes in plain English and watch them happen. Add rooms, rearrange furniture, or clear the plan — all through conversation.",
  },
  {
    icon: Sparkles,
    title: "AI Room Furnishing",
    description:
      "Let AI suggest optimal furniture placement for any room. One click to a beautifully arranged space.",
  },
  {
    icon: History,
    title: "Versions",
    description:
      "Save named snapshots of your design and restore any version instantly. Never lose a good iteration.",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Download as PDF, capture screenshots, share with a link. Your designs, anywhere you need them.",
  },
];

export const FeaturesSection = () => (
  <AnimatedSection id="features">
    <SectionDivider />
    <div className="mx-auto max-w-6xl">
      <SectionHeading
        className="mb-16 text-center"
        eyebrow="Features"
        title="Everything You Need to Design"
        description="A complete toolkit for designing beautiful, functional spaces without the learning curve."
      />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((feature, i) => (
          <FeatureCard key={feature.title} index={i} {...feature} />
        ))}
      </div>
    </div>
  </AnimatedSection>
);

const FeatureCard = ({ icon: Icon, title, description, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    card.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      variants={scaleIn}
      custom={index}
      onMouseMove={handleMouseMove}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: SPOTLIGHT }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/0 to-transparent transition-all duration-500 group-hover:via-primary/50" />

      <div className="relative z-10">
        <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 transition-colors duration-300 group-hover:bg-primary/15">
          <Icon className="size-6 text-primary" />
        </div>
        <h3 className="mb-2 font-heading text-lg text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};
