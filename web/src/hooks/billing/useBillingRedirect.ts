import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { BILLING_API_ROUTES } from "./constants";

type BillingDestination = "checkout" | "portal";

type BillingUrlResponse = {
  url: string | null;
};

const NO_URL_MESSAGES = {
  checkout: "Checkout could not be started. Try again in a moment.",
  portal: "The billing portal could not be opened. Try again in a moment.",
} satisfies Record<BillingDestination, string>;

export const useBillingRedirect = (destination: BillingDestination) =>
  useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post<BillingUrlResponse>(
        BILLING_API_ROUTES[destination],
      );
      if (data.url === null) throw new Error(NO_URL_MESSAGES[destination]);
      return data.url;
    },
    onSuccess: (url) => window.location.assign(url),
  });
