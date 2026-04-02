import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { PlacedFurniture } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface UpdatePlacementPayload {
  designId: string;
  placementId: string;
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export const useUpdatePlacement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designId, placementId, ...payload }: UpdatePlacementPayload) => {
      const response = await axiosInstance.patch<PlacedFurniture>(
        API_ROUTES.placement(designId, placementId),
        payload,
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.placements(variables.designId),
      });
    },
  });
};
