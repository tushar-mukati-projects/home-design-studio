"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { AuthError, AuthField, PasswordField } from "./auth-fields";
import { OAuthButtons } from "./oauth-buttons";
import { useAuthSubmit } from "./use-auth-submit";

export const SignInForm = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { error, setError, submitting, submit } = useAuthSubmit(() => signIn(email, password));

  return (
    <>
      <form onSubmit={submit} className="space-y-4">
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Enter your password"
          autoComplete="current-password"
        />
        <AuthError message={error} />
        <Button type="submit" disabled={submitting} className="h-10 w-full">
          {submitting ? <Loader2 className="animate-spin" /> : "Sign In"}
        </Button>
      </form>

      <OAuthButtons onError={setError} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign up
        </Link>
      </p>
    </>
  );
};
