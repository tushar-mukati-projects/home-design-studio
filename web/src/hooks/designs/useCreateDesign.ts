import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface CreateDesignPayload {
  name: string;
  description?: string;
}

export const useCreateDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateDesignPayload) => {
      const response = await axiosInstance.post<Design>(API_ROUTES.designs, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
    },
  });
};
