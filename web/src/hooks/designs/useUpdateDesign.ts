import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Canvas } from "@/shared/canvas";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

type UpdateDesignPayload = {
  id: string;
  name?: string;
  description?: string;
  thumbnail?: string;
  canvasData?: Canvas;
};

export const useUpdateDesign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateDesignPayload) =>
      (await axiosInstance.patch<Design>(API_ROUTES.design(id), payload)).data,
    onSuccess: (design) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.lists() });
      queryClient.setQueryData(QUERY_KEYS.detail(design.id), design);
    },
  });
};
