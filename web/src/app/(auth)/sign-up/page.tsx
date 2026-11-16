import type { Metadata } from "next";
import { AuthCard } from "@/features/auth/auth-card";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create account",
};

const SignUpPage = () => (
  <AuthCard subtitle="Create your account">
    <SignUpForm />
  </AuthCard>
);

export default SignUpPage;
