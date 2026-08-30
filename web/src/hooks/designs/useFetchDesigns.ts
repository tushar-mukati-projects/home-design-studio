import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignSummary } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface FetchDesignsFilters {
  search?: string;
}

interface DesignsResponse {
  designs: DesignSummary[];
  total: number;
  limit: number;
  offset: number;
}

export const useFetchDesigns = (filters?: FetchDesignsFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<DesignsResponse>(API_ROUTES.designs, {
        params: filters,
      });
      return response.data.designs;
    },
  });
};
