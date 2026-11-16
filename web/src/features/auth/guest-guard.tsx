"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FullScreenLoader } from "@/components/layout/full-screen-loader";
import { useAuth } from "@/lib/auth-context";

type GuestGuardProps = {
  children: React.ReactNode;
};

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return <FullScreenLoader label="Checking your session" />;
  if (user) return <FullScreenLoader label="Taking you to your designs" />;
  return children;
};
