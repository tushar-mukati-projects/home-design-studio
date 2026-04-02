"use client";

import { AuthGuard } from "@/components/layout/auth-guard";
import { DashboardView } from "@/features/dashboard/dashboard-view";

const DashboardPage = () => {
  return (
    <AuthGuard>
      <DashboardView />
    </AuthGuard>
  );
};

export default DashboardPage;
