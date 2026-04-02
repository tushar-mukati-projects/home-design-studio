"use client";

import { Sparkles, Infinity, Users, Wand2, Palette, Check, CreditCard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateCheckout, useCreatePortal, useFetchPlan } from "@/hooks/billing";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
}

interface FeatureItemProps {
  icon: React.ReactNode;
  label: string;
}

const PRO_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? "";

const PRO_FEATURES: FeatureItemProps[] = [
  { icon: <Infinity className="h-4 w-4" />, label: "Unlimited designs" },
  { icon: <Users className="h-4 w-4" />, label: "Real-time collaboration & sharing" },
  { icon: <Wand2 className="h-4 w-4" />, label: "AI-powered design suggestions" },
  { icon: <Palette className="h-4 w-4" />, label: "Premium templates & exports" },
];

const FeatureItem = ({ icon, label }: FeatureItemProps) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
      {icon}
    </div>
    <span className="text-sm text-[var(--foreground)]">{label}</span>
  </div>
);

export const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const { data: planData } = useFetchPlan();
  const checkout = useCreateCheckout();
  const portal = useCreatePortal();

  const isPro = planData?.plan === "pro";

  const handleUpgrade = () => {
    if (!PRO_PRICE_ID) return;
    checkout.mutate({ priceId: PRO_PRICE_ID });
  };

  const handleManageBilling = () => {
    portal.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/80 px-4 pt-6 pb-5 sm:px-6 sm:pt-8 sm:pb-6">
          <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-6 translate-y-6 rounded-full bg-white/5" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <Badge className="border-white/20 bg-white/20 text-white">
                {isPro ? "Current Plan" : "Upgrade"}
              </Badge>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl text-white font-semibold">
                {isPro ? "You are on Pro" : "Unlock Pro"}
              </DialogTitle>
              <DialogDescription className="text-white/80">
                {isPro
                  ? "You have access to all Pro features."
                  : "Get unlimited designs, collaboration, and AI features."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-4 pt-4 pb-6 sm:px-6">
          <div className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                {isPro ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <FeatureItem icon={feature.icon} label="" />
                )}
                <span className="text-sm text-[var(--foreground)]">{feature.label}</span>
              </div>
            ))}
          </div>

          {isPro ? (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleManageBilling}
              disabled={portal.isPending}
            >
              <CreditCard className="h-4 w-4" />
              {portal.isPending ? "Loading..." : "Manage Billing"}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                className="w-full gap-2"
                onClick={handleUpgrade}
                disabled={checkout.isPending || !PRO_PRICE_ID}
              >
                <Sparkles className="h-4 w-4" />
                {checkout.isPending ? "Loading..." : "Upgrade to Pro"}
              </Button>
              <p className="text-center text-xs text-[var(--muted-foreground)]">
                Cancel anytime. Secure payment via Stripe.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
