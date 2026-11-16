import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignListResponse } from "@/types";
import { API_ROUTES, QUERY_KEYS, type DesignListFilters } from "./constants";

export const useFetchDesigns = (filters: DesignListFilters) =>
  useQuery({
    queryKey: QUERY_KEYS.list(filters),
    queryFn: async () =>
      (await axiosInstance.get<DesignListResponse>(API_ROUTES.designs, { params: filters })).data,
    placeholderData: keepPreviousData,
  });
