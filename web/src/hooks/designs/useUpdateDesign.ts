import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design, CanvasData, Room, PlacedFurniture } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface UpdateDesignPayload {
  id: string;
  name?: string;
  description?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  isPublic?: boolean;
  canvasData?: CanvasData;
  rooms?: Room[];
  furniture?: PlacedFurniture[];
}

export const useUpdateDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDesignPayload) => {
      const response = await axiosInstance.patch<Design>(API_ROUTES.design(id), payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.setQueryData(QUERY_KEYS.detail(data.id), data);
    },
  });
};
