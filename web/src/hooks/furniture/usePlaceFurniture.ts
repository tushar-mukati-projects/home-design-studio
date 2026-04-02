import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { PlacedFurniture } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface PlaceFurniturePayload {
  designId: string;
  furnitureItemId: string;
  x: number;
  y: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
}

export const usePlaceFurniture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designId, ...payload }: PlaceFurniturePayload) => {
      const response = await axiosInstance.post<PlacedFurniture>(
        API_ROUTES.placements(designId),
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
