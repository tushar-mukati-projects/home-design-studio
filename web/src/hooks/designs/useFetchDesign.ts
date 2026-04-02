import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useFetchDesign = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Design>(API_ROUTES.design(id));
      return response.data;
    },
    enabled: !!id,
  });
};
