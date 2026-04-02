import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useDeleteDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await axiosInstance.delete(API_ROUTES.design(id));
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.detail(id) });
    },
  });
};
