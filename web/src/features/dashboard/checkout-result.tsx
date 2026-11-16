"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BILLING_QUERY_KEYS } from "@/hooks/billing/constants";

export const CheckoutResult = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const status = searchParams.get("checkout");
    if (status === "success") {
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.plan });
      toast.success("Payment successful! Your plan has been upgraded.");
      router.replace("/dashboard", { scroll: false });
    } else if (status === "cancelled") {
      toast.info("Checkout was cancelled.");
      router.replace("/dashboard", { scroll: false });
    }
  }, [searchParams, queryClient, router]);

  return null;
};
