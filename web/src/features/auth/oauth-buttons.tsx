"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authErrorMessage } from "@/lib/auth-error";
import { useAuth } from "@/lib/auth-context";
import { GithubIcon, GoogleIcon } from "./provider-icons";

type OAuthProvider = "google" | "github";

type OAuthButtonsProps = {
  onError: (message: string) => void;
};

type ProviderButtonProps = {
  provider: OAuthProvider;
  pending: OAuthProvider | null;
  onClick: (provider: OAuthProvider) => void;
};

const PROVIDER_LABELS = { google: "Google", github: "GitHub" } satisfies Record<
  OAuthProvider,
  string
>;

const PROVIDER_ICONS = { google: <GoogleIcon />, github: <GithubIcon /> } satisfies Record<
  OAuthProvider,
  React.ReactNode
>;

export const OAuthButtons = ({ onError }: OAuthButtonsProps) => {
  const { signInWithGoogle, signInWithGithub } = useAuth();
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const signIn = { google: signInWithGoogle, github: signInWithGithub };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (pending) return;
    setPending(provider);
    onError("");
    try {
      await signIn[provider]();
    } catch (error) {
      onError(authErrorMessage(error));
    } finally {
      setPending(null);
    }
  };

  return (
    <>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ProviderButton provider="google" pending={pending} onClick={handleOAuth} />
        <ProviderButton provider="github" pending={pending} onClick={handleOAuth} />
      </div>
    </>
  );
};

const ProviderButton = ({ provider, pending, onClick }: ProviderButtonProps) => (
  <Button
    variant="outline"
    className="h-10"
    onClick={() => onClick(provider)}
    disabled={pending !== null}
  >
    {pending === provider ? <Loader2 className="animate-spin" /> : PROVIDER_ICONS[provider]}
    {PROVIDER_LABELS[provider]}
  </Button>
);
