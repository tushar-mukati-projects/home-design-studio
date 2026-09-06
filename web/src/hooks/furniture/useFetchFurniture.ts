import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { CatalogItem } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

interface FetchFurnitureFilters {
  category?: string;
  search?: string;
}

export const useFetchFurniture = (filters?: FetchFurnitureFilters) => {
  return useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: async () => {
      const response = await axiosInstance.get<CatalogItem[]>(API_ROUTES.furniture, {
        params: filters,
      });
      return response.data;
    },
  });
};
