import { AuthBackground } from "@/features/auth/auth-background";
import { GuestGuard } from "@/features/auth/guest-guard";

type AuthLayoutProps = {
  children: React.ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
    <AuthBackground />
    <GuestGuard>{children}</GuestGuard>
  </div>
);

export default AuthLayout;
