"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBillingRedirect } from "@/hooks/billing/useBillingRedirect";

export const UpgradeButton = () => {
  const checkout = useBillingRedirect("checkout");
  return (
    <Button className="w-full" onClick={() => checkout.mutate()} disabled={checkout.isPending}>
      <Sparkles />
      {checkout.isPending ? "Loading..." : "Upgrade to Pro"}
    </Button>
  );
};
