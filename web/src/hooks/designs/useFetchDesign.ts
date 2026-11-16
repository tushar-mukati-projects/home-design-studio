import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignWithPermission } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useFetchDesign = (id: string, code?: string) =>
  useQuery({
    queryKey: code ? [...QUERY_KEYS.detail(id), code] : QUERY_KEYS.detail(id),
    queryFn: async () =>
      (
        await axiosInstance.get<DesignWithPermission>(API_ROUTES.design(id), {
          params: code ? { code } : undefined,
        })
      ).data,
    enabled: !!id,
  });
