import type { Metadata } from "next";
import { PricingView } from "@/features/billing/pricing-view";

export const metadata: Metadata = {
  title: "Pricing",
};

const PricingPage = () => <PricingView />;

export default PricingPage;
