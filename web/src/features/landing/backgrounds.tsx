"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { INK, MUTED_INK, gridLines } from "./landing-colors";

const NOISE_IMAGE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;
const MINOR_GRID_PX = 30;
const MAJOR_GRID_PX = 150;
const PARALLAX_RANGE = ["0%", "20%"];

const MESH_BLOBS = [
  {
    className: "absolute -top-32 -right-32 size-150 rounded-full opacity-[0.07]",
    background: `radial-gradient(circle, ${INK} 0%, transparent 70%)`,
    animate: { x: [0, 30, -20, 0], y: [0, -20, 15, 0] },
    duration: 20,
  },
  {
    className: "absolute -bottom-40 -left-40 size-125 rounded-full opacity-[0.05]",
    background: `radial-gradient(circle, ${INK} 0%, ${MUTED_INK} 30%, transparent 70%)`,
    animate: { x: [0, -25, 15, 0], y: [0, 25, -10, 0] },
    duration: 25,
  },
  {
    className:
      "absolute top-1/3 left-1/2 size-100 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03]",
    background: `radial-gradient(circle, ${MUTED_INK} 0%, transparent 60%)`,
    animate: { scale: [1, 1.15, 0.95, 1] },
    duration: 18,
  },
];

export const NoiseOverlay = () => (
  <div
    className="pointer-events-none fixed inset-0 z-1 opacity-[0.035]"
    style={{
      backgroundImage: NOISE_IMAGE,
      backgroundRepeat: "repeat",
      backgroundSize: "256px 256px",
    }}
  />
);

export const BlueprintGrid = () => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], PARALLAX_RANGE);

  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ y }}>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: gridLines(INK, MINOR_GRID_PX) }}
      />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: gridLines(INK, MAJOR_GRID_PX) }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,var(--background)_75%)]" />
    </motion.div>
  );
};

export const HeroGradientMesh = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    {MESH_BLOBS.map((blob) => (
      <motion.div
        key={blob.duration}
        className={blob.className}
        style={{ background: blob.background }}
        animate={blob.animate}
        transition={{ duration: blob.duration, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </div>
);
