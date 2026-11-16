"use client";

import { motion } from "framer-motion";
import { WINDOW_GLASS_3D } from "@/features/editor/canvas/palette";
import { INK, MUTED_INK, gridLines } from "./landing-colors";

export type StepNumber = 1 | 2 | 3;

type StepIllustrationProps = {
  step: StepNumber;
};

const IN_VIEW = { viewport: { once: true } };
const STEP_GRID_PX = 20;

const OUTLINE_HANDLES = [
  [30, 30],
  [146, 30],
  [146, 146],
  [88, 146],
  [88, 88],
  [30, 88],
];

const DROPPED_PIECES = [
  { x: 35, y: 100, width: 55, height: 24, rx: 4, opacity: 0.25, delay: 0.3 },
  { x: 50, y: 65, width: 30, height: 20, rx: 3, opacity: 0.15, delay: 0.5 },
];

const BOX_FACES = [
  { points: "30,115 88,142 146,115 88,88", opacity: 0.1 },
  { points: "30,115 30,55 88,28 88,88", opacity: 0.06 },
  { points: "146,115 146,55 88,28 88,88", opacity: 0.04 },
];

export const StepIllustration = ({ step }: StepIllustrationProps) => (
  <div className="relative mx-auto size-44">
    {step === 1 && (
      <div
        className="absolute inset-0 rounded-xl opacity-[0.07]"
        style={{ backgroundImage: gridLines(INK, STEP_GRID_PX) }}
      />
    )}
    <svg viewBox="0 0 176 176" className="absolute inset-0 h-full w-full">
      {step === 1 && <DrawLayout />}
      {step === 2 && <Furnish />}
      {step === 3 && <Preview3d />}
    </svg>
  </div>
);

const DrawLayout = () => (
  <>
    <motion.path
      d="M 30 30 L 146 30 L 146 146 L 88 146 L 88 88 L 30 88 Z"
      stroke={INK}
      strokeWidth="2.5"
      fill="none"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      {...IN_VIEW}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    />
    {OUTLINE_HANDLES.map(([cx, cy], i) => (
      <motion.circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r="4"
        fill={INK}
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        {...IN_VIEW}
        transition={{ delay: 1.2 + i * 0.1, duration: 0.3 }}
      />
    ))}
    <motion.g
      initial={{ x: -20, y: 30, opacity: 0 }}
      whileInView={{ x: 0, y: 0, opacity: 0.7 }}
      {...IN_VIEW}
      transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
    >
      <polygon
        points="140,35 140,52 147,47 153,57 157,55 151,45 158,42"
        fill={MUTED_INK}
        opacity={0.6}
      />
    </motion.g>
  </>
);

const Furnish = () => (
  <>
    <rect
      x="20"
      y="20"
      width="136"
      height="136"
      rx="2"
      stroke={INK}
      strokeWidth="1.5"
      fill="none"
      opacity={0.3}
    />
    {DROPPED_PIECES.map(({ delay, ...piece }) => (
      <motion.rect
        key={delay}
        {...piece}
        fill={INK}
        stroke={INK}
        strokeWidth="1"
        initial={{ opacity: 0, y: -30 }}
        whileInView={{ opacity: 1, y: 0 }}
        {...IN_VIEW}
        transition={{ delay, duration: 0.7, ease: "easeOut" }}
      />
    ))}
    <motion.circle
      cx="120"
      cy="60"
      r="14"
      fill={INK}
      opacity={0.15}
      stroke={INK}
      strokeWidth="1"
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      {...IN_VIEW}
      transition={{ delay: 0.7, duration: 0.5 }}
    />
    <motion.rect
      x="110"
      y="100"
      width="36"
      height="12"
      rx="2"
      fill={INK}
      opacity={0.12}
      stroke={INK}
      strokeWidth="0.8"
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      {...IN_VIEW}
      transition={{ delay: 0.9, duration: 0.5 }}
    />
    <motion.g
      initial={{ x: 30, y: 30, opacity: 0 }}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      {...IN_VIEW}
      transition={{ delay: 0.2, duration: 1 }}
    >
      <polygon
        points="115,115 115,133 122,128 128,138 132,136 126,126 133,123"
        fill={MUTED_INK}
        opacity={0.7}
      />
    </motion.g>
    <motion.g
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.4 }}
      {...IN_VIEW}
      transition={{ delay: 1.1, duration: 0.5 }}
    >
      <line x1="35" y1="140" x2="90" y2="140" stroke={INK} strokeWidth="0.8" />
      <text x="62" y="152" textAnchor="middle" fill={INK} fontSize="8">
        1.8m
      </text>
    </motion.g>
  </>
);

const Preview3d = () => (
  <>
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      {...IN_VIEW}
      transition={{ duration: 0.8 }}
    >
      {BOX_FACES.map((face) => (
        <polygon key={face.points} {...face} fill={INK} stroke={INK} strokeWidth="1" />
      ))}
      <motion.rect
        x="42"
        y="50"
        width="24"
        height="20"
        fill={WINDOW_GLASS_3D}
        opacity={0.08}
        stroke={WINDOW_GLASS_3D}
        strokeWidth="0.5"
        transform="skewY(-30)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        {...IN_VIEW}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
    </motion.g>
    <motion.rect
      x="75"
      y="100"
      width="26"
      height="14"
      rx="2"
      fill={INK}
      opacity={0.2}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.2 }}
      {...IN_VIEW}
      transition={{ delay: 1, duration: 0.5 }}
    />
    <motion.path
      d="M 68 155 A 22 9 0 1 1 108 155"
      stroke={INK}
      strokeWidth="1.5"
      fill="none"
      opacity={0.5}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.5 }}
      {...IN_VIEW}
      transition={{ delay: 0.8, duration: 0.5 }}
    />
    <motion.polygon
      points="106,151 112,156 106,159"
      fill={INK}
      opacity={0.5}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.5 }}
      {...IN_VIEW}
      transition={{ delay: 0.8, duration: 0.5 }}
    />
  </>
);
