import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/auth-card";
import { SignInForm } from "@/features/auth/sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
};

const SignInPage = () => (
  <AuthCard subtitle="Welcome back">
    <SignInForm />
  </AuthCard>
);

export default SignInPage;
