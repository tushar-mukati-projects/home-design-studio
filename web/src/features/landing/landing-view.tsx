"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, type Variants } from "framer-motion";
import {
  Grid3X3,
  Box,
  ScanLine,
  Armchair,
  Sparkles,
  Download,
  Play,
  ArrowRight,
  Home,
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Minus,
  Square,
  Circle,
  MousePointerClick,
  PenTool,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: (i: number = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  id?: string;
}

const AnimatedSection = ({ children, className = "", id }: AnimatedSectionProps) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id={id} className={className} style={{ willChange: "opacity" }}>
      <motion.div
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={{
          visible: { transition: { staggerChildren: 0.1 } },
        }}
      >
        {children}
      </motion.div>
    </section>
  );
};

const NoiseOverlay = () => {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
        backgroundSize: "256px 256px",
      }}
    />
  );
};

const BlueprintGrid = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, #2c2c2e 0px, transparent 1px, transparent 30px),
            repeating-linear-gradient(90deg, #2c2c2e 0px, transparent 1px, transparent 30px)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, #2c2c2e 0px, transparent 1px, transparent 150px),
            repeating-linear-gradient(90deg, #2c2c2e 0px, transparent 1px, transparent 150px)
          `,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_75%)]" />
    </motion.div>
  );
};

const HeroGradientMesh = () => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, #2c2c2e 0%, transparent 70%)",
        }}
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 15, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, #2c2c2e 0%, #71717a 30%, transparent 70%)",
        }}
        animate={{
          x: [0, -25, 15, 0],
          y: [0, 25, -10, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03]"
        style={{
          background: "radial-gradient(circle, #a1a1aa 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.15, 0.95, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

const EditorMockup = () => {
  return (
    <motion.div
      variants={scaleIn}
      custom={3}
      className="relative mx-auto mt-12 w-full max-w-4xl lg:mt-16"
    >
      <div className="absolute -inset-4 rounded-2xl bg-[#2c2c2e]/5 blur-3xl" />

      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/10">
        <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[#2c2c2e] px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-[#B85450]" />
          <span className="h-3 w-3 rounded-full bg-[#2c2c2e]/60" />
          <span className="h-3 w-3 rounded-full bg-[#4A8C5C]/60" />
          <span className="ml-3 text-xs text-[var(--muted-foreground)]">
            Home Design Studio — My Living Room
          </span>
        </div>
        <div className="flex h-64 sm:h-80 lg:h-96">
          <div className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-[var(--border)] bg-[#2c2c2e] py-4">
            <MousePointerClick className="h-4 w-4 text-[var(--muted-foreground)]" />
            <PenTool className="h-4 w-4 text-[#2c2c2e]" />
            <Square className="h-4 w-4 text-[var(--muted-foreground)]" />
            <Minus className="h-4 w-4 text-[var(--muted-foreground)]" />
            <Circle className="h-4 w-4 text-[var(--muted-foreground)]" />
            <Armchair className="h-4 w-4 text-[var(--muted-foreground)]" />
          </div>
          <div className="relative flex-1 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, #2c2c2e 0px, transparent 1px, transparent 24px),
                  repeating-linear-gradient(90deg, #2c2c2e 0px, transparent 1px, transparent 24px)
                `,
              }}
            />
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 600 400"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
            >
              <motion.path
                d="M 100 60 L 500 60 L 500 340 L 300 340 L 300 200 L 100 200 Z"
                stroke="#2c2c2e"
                strokeWidth="3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
              />
              <motion.path
                d="M 300 60 L 500 60 L 500 340 L 300 340 Z"
                fill="#2c2c2e"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.03 }}
                transition={{ delay: 2, duration: 0.8 }}
              />
              <motion.path
                d="M 100 60 L 300 60 L 300 200 L 100 200 Z"
                fill="#2c2c2e"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.02 }}
                transition={{ delay: 2.2, duration: 0.8 }}
              />
              <motion.line
                x1="300"
                y1="60"
                x2="300"
                y2="200"
                stroke="#2c2c2e"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity={0.5}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: 1.6 }}
              />
              <motion.path
                d="M 180 200 A 30 30 0 0 1 210 200"
                stroke="#2c2c2e"
                strokeWidth="1.5"
                fill="none"
                opacity={0.6}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 2.2, duration: 0.5 }}
              />
              <motion.line
                x1="180"
                y1="200"
                x2="180"
                y2="170"
                stroke="#2c2c2e"
                strokeWidth="1"
                opacity={0.4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 2.3, duration: 0.4 }}
              />
              <motion.line
                x1="380"
                y1="57"
                x2="460"
                y2="57"
                stroke="#87CEEB"
                strokeWidth="4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2.4, duration: 0.5 }}
              />
              <motion.line
                x1="503"
                y1="120"
                x2="503"
                y2="200"
                stroke="#87CEEB"
                strokeWidth="4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 2.5, duration: 0.5 }}
              />
              <motion.rect
                x="340"
                y="260"
                width="120"
                height="50"
                rx="6"
                fill="#2c2c2e"
                opacity={0.15}
                stroke="#2c2c2e"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.6, duration: 0.6 }}
              />
              <motion.line
                x1="380"
                y1="264"
                x2="380"
                y2="306"
                stroke="#2c2c2e"
                strokeWidth="0.5"
                opacity={0.2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 3, duration: 0.4 }}
              />
              <motion.line
                x1="420"
                y1="264"
                x2="420"
                y2="306"
                stroke="#2c2c2e"
                strokeWidth="0.5"
                opacity={0.2}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ delay: 3, duration: 0.4 }}
              />
              <motion.rect
                x="370"
                y="180"
                width="60"
                height="40"
                rx="4"
                fill="#2c2c2e"
                opacity={0.1}
                stroke="#2c2c2e"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.8, duration: 0.6 }}
              />
              <motion.rect
                x="150"
                y="100"
                width="80"
                height="40"
                rx="3"
                fill="#2c2c2e"
                opacity={0.08}
                stroke="#2c2c2e"
                strokeWidth="1"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 3.0, duration: 0.6 }}
              />
              {[
                { cx: 165, cy: 90 },
                { cx: 195, cy: 90 },
                { cx: 215, cy: 90 },
                { cx: 165, cy: 150 },
                { cx: 195, cy: 150 },
                { cx: 215, cy: 150 },
              ].map((chair, i) => (
                <motion.circle
                  key={`chair-${i}`}
                  cx={chair.cx}
                  cy={chair.cy}
                  r="7"
                  fill="none"
                  stroke="#2c2c2e"
                  strokeWidth="0.8"
                  opacity={0.15}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.15, scale: 1 }}
                  transition={{ delay: 3.1 + i * 0.08, duration: 0.3 }}
                />
              ))}
              <motion.rect
                x="484"
                y="230"
                width="12"
                height="60"
                rx="2"
                fill="#2c2c2e"
                opacity={0.12}
                stroke="#2c2c2e"
                strokeWidth="0.8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.12 }}
                transition={{ delay: 3.2, duration: 0.5 }}
              />
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 3.4, duration: 0.5 }}
              >
                <text x="300" y="48" textAnchor="middle" fill="#2c2c2e" fontSize="11">
                  5.2m
                </text>
                <line
                  x1="110"
                  y1="48"
                  x2="270"
                  y2="48"
                  stroke="#2c2c2e"
                  strokeWidth="0.5"
                  opacity={0.3}
                />
                <line
                  x1="330"
                  y1="48"
                  x2="490"
                  y2="48"
                  stroke="#2c2c2e"
                  strokeWidth="0.5"
                  opacity={0.3}
                />
              </motion.g>
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ delay: 3.5, duration: 0.5 }}
              >
                <text x="520" y="200" textAnchor="start" fill="#2c2c2e" fontSize="11">
                  3.8m
                </text>
              </motion.g>
              <motion.text
                x="400"
                y="155"
                textAnchor="middle"
                fill="#71717a"
                fontSize="13"
                opacity={0.3}
                fontFamily="Inter, sans-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 3.6, duration: 0.5 }}
              >
                Living Room
              </motion.text>
              <motion.text
                x="200"
                y="130"
                textAnchor="middle"
                fill="#71717a"
                fontSize="12"
                opacity={0.25}
                fontFamily="Inter, sans-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.25 }}
                transition={{ delay: 3.7, duration: 0.5 }}
              >
                Kitchen
              </motion.text>
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.8, 0.8, 0] }}
                transition={{
                  delay: 3.8,
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <rect x="337" y="257" width="6" height="6" fill="#2c2c2e" opacity={0.8} />
                <rect x="457" y="257" width="6" height="6" fill="#2c2c2e" opacity={0.8} />
                <rect x="337" y="307" width="6" height="6" fill="#2c2c2e" opacity={0.8} />
                <rect x="457" y="307" width="6" height="6" fill="#2c2c2e" opacity={0.8} />
              </motion.g>
            </svg>
          </div>
          <div className="hidden w-48 shrink-0 border-l border-[var(--border)] bg-[#2c2c2e] p-4 lg:block">
            <p className="text-[10px] font-semibold tracking-widest text-[var(--muted-foreground)] uppercase">
              Properties
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)]">Room</span>
                <p className="text-xs text-[var(--foreground)]">Living Room</p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)]">Area</span>
                <p className="text-xs text-[var(--foreground)]">
                  19.76 m<sup>2</sup>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-[var(--muted-foreground)]">Walls</span>
                <p className="text-xs text-[var(--foreground)]">6 segments</p>
              </div>
              <div className="pt-2">
                <span className="text-[10px] text-[var(--muted-foreground)]">Furniture</span>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-1.5 rounded bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)]">
                    <Armchair className="h-3 w-3 text-[#2c2c2e]" /> Sofa
                  </div>
                  <div className="flex items-center gap-1.5 rounded bg-[var(--secondary)] px-2 py-1 text-[10px] text-[var(--foreground)]">
                    <Square className="h-3 w-3 text-[#2c2c2e]" /> Coffee Table
                  </div>
                </div>
              </div>
              <div className="mt-3 border-t border-[var(--border)] pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--muted-foreground)]">3D Preview</span>
                  <div className="flex h-4 w-8 items-center rounded-full bg-[#2c2c2e]/20 px-0.5">
                    <motion.div
                      className="h-3 w-3 rounded-full bg-[#2c2c2e]"
                      animate={{ x: [0, 12, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 4,
                        ease: "easeInOut",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const featureData = [
  {
    icon: Grid3X3,
    title: "2D Floor Plan Editor",
    description:
      "Draw walls, place doors and windows with snap-to-grid precision. Intuitive tools that feel natural from the first click.",
  },
  {
    icon: ScanLine,
    title: "Smart Room Detection",
    description:
      "Automatically detect enclosed rooms from your wall layout. No manual tagging needed.",
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
    icon: Sparkles,
    title: "AI Room Furnishing",
    description:
      "Let AI suggest optimal furniture placement for any room. One click to a beautifully arranged space.",
  },
  {
    icon: Download,
    title: "Export & Share",
    description:
      "Download as PDF, capture screenshots, share with a link. Your designs, anywhere you need them.",
  },
];

interface FeatureCardProps {
  icon: typeof Grid3X3;
  title: string;
  description: string;
  index: number;
}

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
      className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm transition-all duration-300 hover:border-[#2c2c2e]/30 hover:shadow-md hover:shadow-[#2c2c2e]/5"
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(400px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(44, 44, 46,0.08), transparent 70%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2c2c2e]/0 to-transparent transition-all duration-500 group-hover:via-[#2c2c2e]/50" />

      <div className="relative z-10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2c2c2e]/10 transition-colors duration-300 group-hover:bg-[#2c2c2e]/15">
          <Icon className="h-6 w-6 text-[#2c2c2e]" />
        </div>
        <h3
          className="mb-2 text-lg text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
      </div>
    </motion.div>
  );
};

interface StepIllustrationProps {
  step: 1 | 2 | 3;
}

const StepIllustration = ({ step }: StepIllustrationProps) => {
  if (step === 1) {
    return (
      <div className="relative mx-auto h-44 w-44">
        <div
          className="absolute inset-0 rounded-xl opacity-[0.07]"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, #2c2c2e 0px, transparent 1px, transparent 20px),
              repeating-linear-gradient(90deg, #2c2c2e 0px, transparent 1px, transparent 20px)
            `,
          }}
        />
        <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full">
          <motion.path
            d="M 30 30 L 146 30 L 146 146 L 88 146 L 88 88 L 30 88 Z"
            stroke="#2c2c2e"
            strokeWidth="2.5"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          {[
            [30, 30],
            [146, 30],
            [146, 146],
            [88, 146],
            [88, 88],
            [30, 88],
          ].map(([cx, cy], i) => (
            <motion.circle
              key={`handle-${i}`}
              cx={cx}
              cy={cy}
              r="4"
              fill="#2c2c2e"
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.2 + i * 0.1, duration: 0.3 }}
            />
          ))}
          <motion.g
            initial={{ x: -20, y: 30, opacity: 0 }}
            whileInView={{ x: 0, y: 0, opacity: 0.7 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
          >
            <polygon
              points="140,35 140,52 147,47 153,57 157,55 151,45 158,42"
              fill="#71717a"
              opacity={0.6}
            />
          </motion.g>
        </svg>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="relative mx-auto h-44 w-44">
        <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full">
          <rect
            x="20"
            y="20"
            width="136"
            height="136"
            rx="2"
            stroke="#2c2c2e"
            strokeWidth="1.5"
            fill="none"
            opacity={0.3}
          />
          <motion.rect
            x="35"
            y="100"
            width="55"
            height="24"
            rx="4"
            fill="#2c2c2e"
            opacity={0.25}
            stroke="#2c2c2e"
            strokeWidth="1"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
          />
          <motion.rect
            x="50"
            y="65"
            width="30"
            height="20"
            rx="3"
            fill="#2c2c2e"
            opacity={0.15}
            stroke="#2c2c2e"
            strokeWidth="1"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          />
          <motion.circle
            cx="120"
            cy="60"
            r="14"
            fill="#2c2c2e"
            opacity={0.15}
            stroke="#2c2c2e"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.5 }}
          />
          <motion.rect
            x="110"
            y="100"
            width="36"
            height="12"
            rx="2"
            fill="#2c2c2e"
            opacity={0.12}
            stroke="#2c2c2e"
            strokeWidth="0.8"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.5 }}
          />
          <motion.g
            initial={{ x: 30, y: 30, opacity: 0 }}
            whileInView={{ x: 0, y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 1 }}
          >
            <polygon
              points="115,115 115,133 122,128 128,138 132,136 126,126 133,123"
              fill="#71717a"
              opacity={0.7}
            />
          </motion.g>
          <motion.g
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 0.4 }}
            viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            <line x1="35" y1="140" x2="90" y2="140" stroke="#2c2c2e" strokeWidth="0.8" />
            <text x="62" y="152" textAnchor="middle" fill="#2c2c2e" fontSize="8">
              1.8m
            </text>
          </motion.g>
        </svg>
      </div>
    );
  }
  return (
    <div className="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full">
        <motion.g
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <polygon
            points="30,115 88,142 146,115 88,88"
            fill="#2c2c2e"
            opacity={0.1}
            stroke="#2c2c2e"
            strokeWidth="1"
          />
          <polygon
            points="30,115 30,55 88,28 88,88"
            fill="#2c2c2e"
            opacity={0.06}
            stroke="#2c2c2e"
            strokeWidth="1"
          />
          <polygon
            points="146,115 146,55 88,28 88,88"
            fill="#2c2c2e"
            opacity={0.04}
            stroke="#2c2c2e"
            strokeWidth="1"
          />
          <motion.rect
            x="42"
            y="50"
            width="24"
            height="20"
            fill="#87CEEB"
            opacity={0.08}
            stroke="#87CEEB"
            strokeWidth="0.5"
            transform="skewY(-30)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8, duration: 0.5 }}
          />
        </motion.g>
        <motion.rect
          x="75"
          y="100"
          width="26"
          height="14"
          rx="2"
          fill="#2c2c2e"
          opacity={0.2}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.2 }}
          viewport={{ once: true }}
          transition={{ delay: 1, duration: 0.5 }}
        />
        <motion.path
          d="M 68 155 A 22 9 0 1 1 108 155"
          stroke="#2c2c2e"
          strokeWidth="1.5"
          fill="none"
          opacity={0.5}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
        <motion.polygon
          points="106,151 112,156 106,159"
          fill="#2c2c2e"
          opacity={0.5}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
      </svg>
    </div>
  );
};

const showcaseData = [
  {
    name: "Modern Living Room",
    dimensions: "5.2m x 3.8m",
    gradientFrom: "#2c2c2e",
    gradientVia: "#1A1A1A",
    gradientTo: "#2c2c2e",
    accent: "#2c2c2e",
  },
  {
    name: "Minimalist Bedroom",
    dimensions: "4.0m x 3.5m",
    gradientFrom: "#3f3f46",
    gradientVia: "#27272a",
    gradientTo: "#2c2c2e",
    accent: "#a1a1aa",
  },
  {
    name: "Open Kitchen",
    dimensions: "6.0m x 4.2m",
    gradientFrom: "#71717a",
    gradientVia: "#27272a",
    gradientTo: "#2c2c2e",
    accent: "#a1a1aa",
  },
];

type ShowcaseCardProps = (typeof showcaseData)[number] & { index: number };

const ShowcaseCard = ({
  name,
  dimensions,
  gradientFrom,
  gradientVia,
  gradientTo,
  accent,
  index,
}: ShowcaseCardProps) => {
  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-500 hover:border-[#2c2c2e]/20 hover:shadow-lg hover:shadow-[#2c2c2e]/10"
    >
      <div
        className="absolute inset-0 transition-transform duration-700 group-hover:scale-105"
        style={{
          background: `
            linear-gradient(135deg, ${gradientFrom}15 0%, ${gradientVia} 40%, ${gradientTo} 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] transition-opacity duration-500 group-hover:opacity-[0.08]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, ${accent} 0px, transparent 1px, transparent 20px),
            repeating-linear-gradient(90deg, ${accent} 0px, transparent 1px, transparent 20px)
          `,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.12] transition-opacity duration-500 group-hover:opacity-[0.2]"
        viewBox="0 0 400 300"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        {index === 0 && (
          <>
            <rect x="60" y="40" width="280" height="220" stroke={accent} strokeWidth="2" />
            <line x1="200" y1="40" x2="200" y2="160" stroke={accent} strokeWidth="1.5" />
            <rect x="80" y="180" width="90" height="40" rx="4" fill={accent} opacity={0.3} />
            <rect x="230" y="70" width="60" height="80" rx="3" fill={accent} opacity={0.2} />
            <circle cx="130" cy="100" r="20" fill={accent} opacity={0.15} />
          </>
        )}
        {index === 1 && (
          <>
            <rect x="50" y="30" width="300" height="240" stroke={accent} strokeWidth="2" />
            <rect x="70" y="50" width="120" height="90" rx="4" fill={accent} opacity={0.25} />
            <rect x="250" y="60" width="70" height="50" rx="3" fill={accent} opacity={0.15} />
            <rect x="250" y="180" width="80" height="60" rx="3" fill={accent} opacity={0.12} />
            <circle cx="130" cy="200" r="25" fill={accent} opacity={0.1} />
          </>
        )}
        {index === 2 && (
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
            {[220, 250, 280, 220, 250, 280].map((cx, i) => (
              <circle
                key={`k-chair-${i}`}
                cx={cx}
                cy={i < 3 ? 90 : 160}
                r="8"
                fill={accent}
                opacity={0.12}
              />
            ))}
          </>
        )}
      </svg>
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse at center, ${accent}08, transparent 70%)`,
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#18181b]/90 via-[#18181b]/30 to-transparent p-6">
        <div className="translate-y-2 transition-transform duration-500 group-hover:translate-y-0">
          <p
            className="text-lg text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {name}
          </p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{dimensions}</p>
          <div className="mt-3 flex items-center gap-1 text-xs font-medium text-[#2c2c2e] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            View design <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

const AnimatedCounter = ({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
}: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      setCount(value);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [isInView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

export const LandingView = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--background)]">
      <NoiseOverlay />
      <Navbar />

      {}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <BlueprintGrid />
        <HeroGradientMesh />
        <div className="pointer-events-none absolute top-24 left-6 h-24 w-24 border-t border-l border-[#2c2c2e]/10 sm:left-12 sm:h-32 sm:w-32" />
        <div className="pointer-events-none absolute right-6 bottom-12 h-24 w-24 border-r border-b border-[#2c2c2e]/10 sm:right-12 sm:h-32 sm:w-32" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-1.5 text-xs font-medium text-[var(--muted-foreground)]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#2c2c2e]" />
                Now in Public Beta
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl leading-[1.1] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <span className="text-[var(--foreground)]">Design Your</span>
              <br />
              <span className="bg-gradient-to-r from-[#2c2c2e] via-[#a1a1aa] to-[#2c2c2e] bg-clip-text text-transparent">
                Dream Space
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[var(--muted-foreground)] sm:text-lg md:text-xl"
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
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="h-12 gap-2 px-8 text-base font-semibold shadow-lg shadow-[#2c2c2e]/20"
                >
                  Start Designing
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 gap-2 px-8 text-base font-medium">
                <Play className="h-4 w-4" />
                Watch Demo
              </Button>
            </motion.div>
            <EditorMockup />
          </motion.div>
        </div>
        <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-[var(--background)] to-transparent" />
      </section>

      {}
      <AnimatedSection id="features" className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[#2c2c2e]/20 to-transparent" />

        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#2c2c2e] uppercase"
            >
              Features
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl tracking-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Everything You Need to Design
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-4 max-w-xl text-[var(--muted-foreground)]"
            >
              A complete toolkit for designing beautiful, functional spaces without the learning
              curve.
            </motion.p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureData.map((feature, i) => (
              <FeatureCard key={feature.title} index={i} {...feature} />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {}
      <AnimatedSection className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2c2c2e]/[0.02] blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#2c2c2e] uppercase"
            >
              How It Works
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl tracking-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Three Steps to Your Dream Home
            </motion.h2>
          </div>
          <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
            <div className="pointer-events-none absolute top-[5.5rem] right-0 left-0 hidden md:block">
              <div className="mx-auto h-px max-w-[70%] bg-gradient-to-r from-transparent via-[#2c2c2e]/20 to-transparent" />
              <div className="absolute top-1/2 left-[33%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2c2c2e]/30" />
              <div className="absolute top-1/2 left-[66%] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2c2c2e]/30" />
            </div>
            <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#2c2c2e]/10 to-transparent md:hidden" />
            <motion.div variants={slideInLeft} custom={0} className="relative text-center">
              <span
                className="mb-4 block text-5xl text-[#2c2c2e]/20 md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                01
              </span>
              <StepIllustration step={1} />
              <h3
                className="mt-6 text-xl text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Draw Your Layout
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
                Sketch walls and define rooms with intuitive drawing tools on a precise grid.
              </p>
            </motion.div>
            <motion.div variants={fadeUp} custom={1} className="relative text-center">
              <span
                className="mb-4 block text-5xl text-[#2c2c2e]/20 md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                02
              </span>
              <StepIllustration step={2} />
              <h3
                className="mt-6 text-xl text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Furnish &amp; Customize
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
                Drag furniture from the catalog, adjust dimensions, and arrange until it feels
                right.
              </p>
            </motion.div>
            <motion.div variants={slideInRight} custom={2} className="relative text-center">
              <span
                className="mb-4 block text-5xl text-[#2c2c2e]/20 md:text-6xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                03
              </span>
              <StepIllustration step={3} />
              <h3
                className="mt-6 text-xl text-[var(--foreground)]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Preview in 3D
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
                Walk through your design in an immersive 3D view and see your space from every
                angle.
              </p>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {}
      <AnimatedSection className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[#2c2c2e]/20 to-transparent" />

        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <motion.p
              variants={fadeUp}
              custom={0}
              className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#2c2c2e] uppercase"
            >
              Showcase
            </motion.p>
            <motion.h2
              variants={fadeUp}
              custom={1}
              className="text-3xl tracking-tight sm:text-4xl md:text-5xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              See What&apos;s Possible
            </motion.h2>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="mx-auto mt-4 max-w-xl text-[var(--muted-foreground)]"
            >
              From cozy bedrooms to open-concept kitchens, bring any vision to life.
            </motion.p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {showcaseData.map((item, i) => (
              <ShowcaseCard key={item.name} index={i} {...item} />
            ))}
          </div>
        </div>
      </AnimatedSection>

      {}
      <AnimatedSection className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-[#2c2c2e]/40 to-transparent" />

        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
          {[
            { value: 10000, suffix: "+", label: "Designs Created" },
            { value: 25, suffix: "+", label: "Furniture Items" },
            { value: 60, suffix: " FPS", label: "Real-time 3D" },
            { value: 0, suffix: "", label: "Cost to Start", prefix: "$" },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
              <p
                className="text-3xl text-[var(--foreground)] sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {stat.value === 0 ? (
                  <span>{stat.prefix}0</span>
                ) : (
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                )}
              </p>
              <p className="mt-2 text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {}
      <AnimatedSection className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
            <div className="h-[500px] w-[500px] rounded-full border border-[#2c2c2e]/[0.04]" />
            <div className="absolute h-[700px] w-[700px] rounded-full border border-[#2c2c2e]/[0.03]" />
            <div className="absolute h-[900px] w-[900px] rounded-full border border-[#2c2c2e]/[0.02]" />
            <div className="absolute h-[300px] w-[300px] rotate-45 border border-[#2c2c2e]/[0.03]" />
            <div className="absolute h-[450px] w-[450px] rotate-45 border border-[#2c2c2e]/[0.02]" />
          </div>
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2c2c2e]/[0.03] blur-3xl" />
          </div>

          <motion.div variants={fadeUp} custom={0}>
            <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-[#2c2c2e] uppercase">
              Get Started
            </p>
          </motion.div>

          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl tracking-tight sm:text-4xl md:text-5xl lg:text-6xl"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Ready to Design
            <br />
            <span className="bg-gradient-to-r from-[#2c2c2e] via-[#a1a1aa] to-[#2c2c2e] bg-clip-text text-transparent">
              Your Space?
            </span>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-lg text-[var(--muted-foreground)] sm:text-lg"
          >
            Join thousands of designers and homeowners who bring their ideas to life.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="mt-10">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-14 gap-2 px-10 text-base font-semibold shadow-lg shadow-[#2c2c2e]/20 sm:text-lg"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </AnimatedSection>

      {}
      <footer className="relative border-t border-[var(--border)] bg-[var(--card)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 md:grid-cols-5">
            <div className="md:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#2c2c2e]">
                  <Home className="h-5 w-5 text-[var(--primary-foreground)]" />
                </div>
                <span
                  className="text-xl text-[var(--foreground)]"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  DesignStudio
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--muted-foreground)]">
                The modern floor plan editor for homeowners, interior designers, and architects.
                Design in 2D, experience in 3D.
              </p>
              <div className="mt-6 flex items-center gap-3">
                {[
                  { icon: Twitter, href: "#" },
                  { icon: Github, href: "#" },
                  { icon: Linkedin, href: "#" },
                  { icon: Instagram, href: "#" },
                ].map(({ icon: SocialIcon, href }, i) => (
                  <a
                    key={i}
                    href={href}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--foreground)]/30 hover:text-[var(--foreground)]"
                  >
                    <SocialIcon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            {[
              {
                title: "Product",
                links: [
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "/pricing" },
                  { label: "Editor", href: "/dashboard" },
                  { label: "3D Preview", href: "#" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About", href: "#" },
                  { label: "Contact", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "Careers", href: "#" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { label: "Privacy", href: "#" },
                  { label: "Terms", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold tracking-widest text-[var(--foreground)] uppercase">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-xs text-[var(--muted-foreground)] sm:flex-row">
            <p>&copy; {new Date().getFullYear()} Home Design Studio. All rights reserved.</p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[10px] font-medium">
                Built with Next.js, Three.js &amp; AI
              </span>
              <span className="text-[var(--muted-foreground)]">
                Built with precision <span className="text-[var(--foreground)]">&bull;</span> Designed with
                care
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
