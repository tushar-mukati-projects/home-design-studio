import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS as DESIGN_QUERY_KEYS } from "../designs/constants";

interface CreateFromTemplatePayload {
  templateId: string;
  name: string;
}

export const useCreateFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateFromTemplatePayload) => {
      const response = await axiosInstance.post<Design>(API_ROUTES.designs, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.lists() });
    },
  });
};
