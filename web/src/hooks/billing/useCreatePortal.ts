import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { BILLING_API_ROUTES } from "./constants";

interface PortalResponse {
  url: string;
}

export const useCreatePortal = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.post<PortalResponse>(BILLING_API_ROUTES.portal);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
};
