import { AuthGuard } from "@/components/layout/auth-guard";

type AppLayoutProps = {
  children: React.ReactNode;
};

const AppLayout = ({ children }: AppLayoutProps) => <AuthGuard>{children}</AuthGuard>;

export default AppLayout;
