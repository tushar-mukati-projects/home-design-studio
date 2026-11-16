"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMe } from "@/hooks/user/useMe";
import { getApiErrorMessage } from "@/lib/api-error";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { BrandLogo } from "./brand-logo";
import { FullScreenLoader } from "./full-screen-loader";

type AuthGuardProps = {
  children: React.ReactNode;
};

type SessionErrorProps = {
  error: unknown;
  retrying: boolean;
  onRetry: () => void;
  onSignOut: () => void;
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const me = useMe(!!user);

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in");
  }, [user, loading, router]);

  if (loading) return <FullScreenLoader label="Checking your session" />;
  if (!user) return null;
  if (me.isError) {
    return (
      <SessionError
        error={me.error}
        retrying={me.isFetching}
        onRetry={() => me.refetch()}
        onSignOut={() => signOut().then(() => router.replace("/sign-in"))}
      />
    );
  }
  if (!me.data) return <FullScreenLoader label="Loading your profile" />;
  return children;
};

const SessionError = ({ error, retrying, onRetry, onSignOut }: SessionErrorProps) => (
  <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background px-6">
    <BrandLogo size="xl" />
    <div className="max-w-sm space-y-4 text-center">
      <p className="text-sm text-muted-foreground">{getApiErrorMessage(error)}</p>
      <div className="flex justify-center gap-2">
        <Button onClick={onRetry} disabled={retrying}>
          <RefreshCw className={cn(retrying && "animate-spin")} />
          {retrying ? "Retrying…" : "Retry"}
        </Button>
        <Button variant="outline" onClick={onSignOut}>
          <LogOut />
          Sign out
        </Button>
      </div>
    </div>
  </div>
);
