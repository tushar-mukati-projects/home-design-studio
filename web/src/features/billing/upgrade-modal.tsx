"use client";

import {
  Check,
  CreditCard,
  ImageIcon,
  Infinity,
  Loader2,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QueryError } from "@/components/ui/query-error";
import { useBillingRedirect } from "@/hooks/billing/useBillingRedirect";
import { useFetchPlan } from "@/hooks/billing/useFetchPlan";
import { UpgradeButton } from "./upgrade-button";

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

type ProFeature = {
  icon: React.ReactNode;
  label: string;
};

type PlanActionsProps = {
  isPro: boolean;
};

const PRO_FEATURES: ProFeature[] = [
  { icon: <Infinity className="size-4" />, label: "Unlimited designs" },
  { icon: <Users className="size-4" />, label: "Real-time collaboration & sharing" },
  { icon: <Wand2 className="size-4" />, label: "Design AI chat and room furnishing" },
  { icon: <ImageIcon className="size-4" />, label: "Import a floor plan from a photo" },
];

export const UpgradeModal = ({ open, onClose }: UpgradeModalProps) => {
  const plan = useFetchPlan();
  const isPro = plan.data?.plan === "pro";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0">
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-primary to-primary/80 px-4 pt-6 pb-5 text-primary-foreground sm:px-6 sm:pt-8 sm:pb-6">
          <div className="absolute top-0 right-0 size-32 translate-x-8 -translate-y-8 rounded-full bg-primary-foreground/10" />
          <div className="absolute bottom-0 left-0 size-24 -translate-x-6 translate-y-6 rounded-full bg-primary-foreground/5" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="size-5" />
              <Badge className="border-primary-foreground/20 bg-primary-foreground/20 text-primary-foreground">
                {isPro ? "Current Plan" : "Upgrade"}
              </Badge>
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold text-primary-foreground">
                {isPro ? "You are on Pro" : "Unlock Pro"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {isPro
                  ? "You have access to all Pro features."
                  : "Get unlimited designs, sharing, and Design AI."}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="space-y-5 px-4 pt-4 pb-6 sm:px-6">
          <div className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <FeatureItem
                key={feature.label}
                icon={isPro ? <Check className="size-4" /> : feature.icon}
                label={feature.label}
              />
            ))}
          </div>

          {plan.isError ? (
            <QueryError
              error={plan.error}
              onRetry={() => plan.refetch()}
              retrying={plan.isFetching}
            />
          ) : plan.data === undefined ? (
            <div className="flex justify-center py-2">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <PlanActions isPro={isPro} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const FeatureItem = ({ icon, label }: ProFeature) => (
  <div className="flex items-center gap-3">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </div>
    <span className="text-sm text-foreground">{label}</span>
  </div>
);

const PlanActions = ({ isPro }: PlanActionsProps) => {
  const portal = useBillingRedirect("portal");

  if (isPro) {
    return (
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => portal.mutate()}
        disabled={portal.isPending}
      >
        <CreditCard className="size-4" />
        {portal.isPending ? "Loading..." : "Manage Billing"}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <UpgradeButton />
      <p className="text-center text-xs text-muted-foreground">
        Cancel anytime. Secure payment via Stripe.
      </p>
    </div>
  );
};
