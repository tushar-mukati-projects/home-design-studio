import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { CatalogItem } from "@/shared/canvas";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useFetchFurniture = () =>
  useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: async () => (await axiosInstance.get<CatalogItem[]>(API_ROUTES.furniture)).data,
  });
