"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Loader2, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useMe } from "@/hooks/user";
import { sessionErrorMessage } from "@/lib/api-error";
import { Button } from "@/components/ui/button";

const Brand = () => (
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
      style={{ fontFamily: "var(--font-heading)" }}
    >
      Home Design Studio
    </span>
  </motion.div>
);

const LoadingScreen = ({ label }: { label: string }) => (
  <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--background)]">
    <Brand />
    <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--primary)]" />
      {label}
    </div>
  </div>
);

const ErrorScreen = ({
  message,
  onRetry,
  onSignOut,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  onSignOut: () => void;
  retrying: boolean;
}) => (
  <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[var(--background)] px-6">
    <Brand />
    <div className="max-w-sm space-y-4 text-center">
      <p className="text-sm text-[var(--muted-foreground)]">{message}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={onRetry} disabled={retrying} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
        <Button variant="outline" onClick={onSignOut} className="gap-2">
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  </div>
);

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const me = useMe(!!user);

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [user, loading, router]);

  if (loading) return <LoadingScreen label="Checking your session" />;
  if (!user) return null;

  if (me.isError) {
    return (
      <ErrorScreen
        message={sessionErrorMessage(me.error)}
        onRetry={() => me.refetch()}
        onSignOut={() => signOut().then(() => router.replace("/sign-in"))}
        retrying={me.isFetching}
      />
    );
  }

  if (!me.data) return <LoadingScreen label="Loading your profile" />;

  return <>{children}</>;
};
