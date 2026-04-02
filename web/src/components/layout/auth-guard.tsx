"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const LoadingScreen = () => {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--background)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--primary)]">
          <Home className="h-6 w-6 text-[var(--primary-foreground)]" />
        </div>
        <span
          className="text-3xl text-[var(--foreground)]"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          DesignStudio
        </span>
      </motion.div>
      <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
    </div>
  );
};

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [user, loading, router]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;
  return <>{children}</>;
};
