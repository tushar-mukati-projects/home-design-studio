import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "My Designs",
};

const DashboardPage = () => <DashboardView />;

export default DashboardPage;
