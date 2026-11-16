"use client";

import { motion } from "framer-motion";
import { WINDOW_GLASS_3D } from "@/features/editor/canvas/palette";
import { INK, MUTED_INK } from "./landing-colors";

const FADE_IN = { initial: { opacity: 0 } };
const POP_IN = { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } };

const WINDOWS = [
  { x1: 380, y1: 57, x2: 460, y2: 57, opacity: 0.5, delay: 2.4 },
  { x1: 503, y1: 120, x2: 503, y2: 200, opacity: 0.4, delay: 2.5 },
];

const FURNITURE = [
  { x: 340, y: 260, width: 120, height: 50, rx: 6, opacity: 0.15, delay: 2.6 },
  { x: 370, y: 180, width: 60, height: 40, rx: 4, opacity: 0.1, delay: 2.8 },
  { x: 150, y: 100, width: 80, height: 40, rx: 3, opacity: 0.08, delay: 3.0 },
];

const SOFA_SEAMS = [380, 420];

const CHAIRS = [
  [165, 90],
  [195, 90],
  [215, 90],
  [165, 150],
  [195, 150],
  [215, 150],
];

const ROOM_LABELS = [
  { x: 400, y: 155, fontSize: 13, opacity: 0.3, delay: 3.6, label: "Living Room" },
  { x: 200, y: 130, fontSize: 12, opacity: 0.25, delay: 3.7, label: "Kitchen" },
];

const SELECTION_HANDLES = [
  [337, 257],
  [457, 257],
  [337, 307],
  [457, 307],
];

export const MockupPlan = () => (
  <svg
    className="absolute inset-0 h-full w-full"
    viewBox="0 0 600 400"
    fill="none"
    preserveAspectRatio="xMidYMid meet"
  >
    <motion.path
      d="M 100 60 L 500 60 L 500 340 L 300 340 L 300 200 L 100 200 Z"
      stroke={INK}
      strokeWidth="3"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
    />
    <motion.path
      d="M 300 60 L 500 60 L 500 340 L 300 340 Z"
      fill={INK}
      {...FADE_IN}
      animate={{ opacity: 0.03 }}
      transition={{ delay: 2, duration: 0.8 }}
    />
    <motion.path
      d="M 100 60 L 300 60 L 300 200 L 100 200 Z"
      fill={INK}
      {...FADE_IN}
      animate={{ opacity: 0.02 }}
      transition={{ delay: 2.2, duration: 0.8 }}
    />
    <motion.line
      x1="300"
      y1="60"
      x2="300"
      y2="200"
      stroke={INK}
      strokeWidth="2"
      strokeDasharray="6 4"
      opacity={0.5}
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1.2, ease: "easeInOut", delay: 1.6 }}
    />
    <motion.path
      d="M 180 200 A 30 30 0 0 1 210 200"
      stroke={INK}
      strokeWidth="1.5"
      opacity={0.6}
      {...FADE_IN}
      animate={{ opacity: 0.6 }}
      transition={{ delay: 2.2, duration: 0.5 }}
    />
    <motion.line
      x1="180"
      y1="200"
      x2="180"
      y2="170"
      stroke={INK}
      strokeWidth="1"
      opacity={0.4}
      {...FADE_IN}
      animate={{ opacity: 0.4 }}
      transition={{ delay: 2.3, duration: 0.4 }}
    />
    {WINDOWS.map(({ delay, opacity, ...line }) => (
      <motion.line
        key={delay}
        {...line}
        stroke={WINDOW_GLASS_3D}
        strokeWidth="4"
        {...FADE_IN}
        animate={{ opacity }}
        transition={{ delay, duration: 0.5 }}
      />
    ))}
    {FURNITURE.map(({ delay, ...rect }) => (
      <motion.rect
        key={delay}
        {...rect}
        fill={INK}
        stroke={INK}
        strokeWidth="1"
        {...POP_IN}
        transition={{ delay, duration: 0.6 }}
      />
    ))}
    {SOFA_SEAMS.map((x) => (
      <motion.line
        key={x}
        x1={x}
        y1="264"
        x2={x}
        y2="306"
        stroke={INK}
        strokeWidth="0.5"
        opacity={0.2}
        {...FADE_IN}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 3, duration: 0.4 }}
      />
    ))}
    {CHAIRS.map(([cx, cy], i) => (
      <motion.circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r="7"
        stroke={INK}
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
      fill={INK}
      opacity={0.12}
      stroke={INK}
      strokeWidth="0.8"
      {...FADE_IN}
      animate={{ opacity: 0.12 }}
      transition={{ delay: 3.2, duration: 0.5 }}
    />
    <motion.g {...FADE_IN} animate={{ opacity: 0.6 }} transition={{ delay: 3.4, duration: 0.5 }}>
      <text x="300" y="48" textAnchor="middle" fill={INK} fontSize="11">
        5.2m
      </text>
      <line x1="110" y1="48" x2="270" y2="48" stroke={INK} strokeWidth="0.5" opacity={0.3} />
      <line x1="330" y1="48" x2="490" y2="48" stroke={INK} strokeWidth="0.5" opacity={0.3} />
    </motion.g>
    <motion.g {...FADE_IN} animate={{ opacity: 0.6 }} transition={{ delay: 3.5, duration: 0.5 }}>
      <text x="520" y="200" textAnchor="start" fill={INK} fontSize="11">
        3.8m
      </text>
    </motion.g>
    {ROOM_LABELS.map(({ label, delay, opacity, ...text }) => (
      <motion.text
        key={label}
        {...text}
        textAnchor="middle"
        fill={MUTED_INK}
        opacity={opacity}
        className="font-sans"
        {...FADE_IN}
        animate={{ opacity }}
        transition={{ delay, duration: 0.5 }}
      >
        {label}
      </motion.text>
    ))}
    <motion.g
      {...FADE_IN}
      animate={{ opacity: [0, 0.8, 0.8, 0] }}
      transition={{ delay: 3.8, duration: 3, repeat: Infinity, repeatDelay: 2 }}
    >
      {SELECTION_HANDLES.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="6" height="6" fill={INK} opacity={0.8} />
      ))}
    </motion.g>
  </svg>
);
