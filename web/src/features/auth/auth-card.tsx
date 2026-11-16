"use client";

import { motion } from "framer-motion";
import { BrandLogo } from "@/components/layout/brand-logo";

type AuthCardProps = {
  subtitle: string;
  children: React.ReactNode;
};

const CARD_EASE = [0.25, 0.46, 0.45, 0.94] as const;
const CARD_DURATION_S = 0.5;

export const AuthCard = ({ subtitle, children }: AuthCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: CARD_DURATION_S, ease: CARD_EASE }}
    className="relative z-10 w-full max-w-md"
  >
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm backdrop-blur-sm">
      <div className="mb-8 flex flex-col items-center gap-3">
        <BrandLogo size="lg" />
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  </motion.div>
);
