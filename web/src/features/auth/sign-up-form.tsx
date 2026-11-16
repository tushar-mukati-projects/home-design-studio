"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-error";
import { useAuth } from "@/lib/auth-context";
import { AuthError, AuthField, PasswordField } from "./auth-fields";
import { OAuthButtons } from "./oauth-buttons";
import { useAuthSubmit } from "./use-auth-submit";

const passwordProblem = (password: string, confirmPassword: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirmPassword) return "Passwords do not match.";
  return null;
};

export const SignUpForm = () => {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { error, setError, submitting, submit } = useAuthSubmit(() =>
    signUp(email, password, name),
  );

  const handleSubmit = (event: React.FormEvent) => {
    const problem = passwordProblem(password, confirmPassword);
    if (!problem) return submit(event);
    event.preventDefault();
    setError(problem);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="name"
          label="Name"
          type="text"
          value={name}
          onChange={setName}
          placeholder="Your name"
          autoComplete="name"
        />
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
          placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
          autoComplete="new-password"
        />
        <PasswordField
          id="confirm-password"
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Repeat your password"
          autoComplete="new-password"
        />
        <AuthError message={error} />
        <Button type="submit" disabled={submitting} className="h-10 w-full">
          {submitting ? <Loader2 className="animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <OAuthButtons onError={setError} />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Sign in
        </Link>
      </p>
    </>
  );
};
