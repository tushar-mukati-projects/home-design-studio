import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface RemovePlacementPayload {
  designId: string;
  placementId: string;
}

export const useRemovePlacement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designId, placementId }: RemovePlacementPayload) => {
      await axiosInstance.delete(API_ROUTES.placement(designId, placementId));
      return { designId, placementId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.placements(variables.designId),
      });
    },
  });
};
