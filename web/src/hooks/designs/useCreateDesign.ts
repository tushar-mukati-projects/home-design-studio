import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BILLING_QUERY_KEYS } from "@/hooks/billing/constants";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export type CreateDesignPayload = {
  name: string;
  description?: string;
  templateId?: string;
  duplicateOf?: string;
};

export const useCreateDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDesignPayload) =>
      (await axiosInstance.post<Design>(API_ROUTES.designs, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEYS.plan });
    },
  });
};
