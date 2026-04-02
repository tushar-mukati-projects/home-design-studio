import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { QUERY_KEYS as DESIGN_QUERY_KEYS } from "../designs/constants";
import { API_ROUTES } from "./constants";

interface CreateFromTemplatePayload {
  templateId: string;
  name: string;
}

export const useCreateFromTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, name }: CreateFromTemplatePayload) => {
      const response = await axiosInstance.post<Design>(API_ROUTES.applyTemplate(templateId), {
        name,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.lists() });
    },
  });
};
