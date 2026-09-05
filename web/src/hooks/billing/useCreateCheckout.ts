import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { BILLING_API_ROUTES } from "./constants";

interface CheckoutResponse {
  url: string;
}

export const useCreateCheckout = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<CheckoutResponse>(BILLING_API_ROUTES.checkout);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
