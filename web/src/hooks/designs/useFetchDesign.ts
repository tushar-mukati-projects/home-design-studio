import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useFetchDesign = (id: string, code?: string) => {
  return useQuery({
    queryKey: code ? [...QUERY_KEYS.detail(id), code] : QUERY_KEYS.detail(id),
    queryFn: async () => {
      const response = await axiosInstance.get<Design>(API_ROUTES.design(id), {
        params: code ? { code } : undefined,
      });
      return response.data;
    },
    enabled: !!id,
    retry: false,
  });
};
