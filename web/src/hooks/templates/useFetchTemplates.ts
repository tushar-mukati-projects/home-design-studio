import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignTemplate } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

export const useFetchTemplates = () =>
  useQuery({
    queryKey: QUERY_KEYS.list(),
    queryFn: async () => (await axiosInstance.get<DesignTemplate[]>(API_ROUTES.templates)).data,
  });
