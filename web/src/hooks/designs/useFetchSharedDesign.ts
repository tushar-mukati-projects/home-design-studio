import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";

export const useFetchSharedDesign = (token: string) => {
  return useQuery({
    queryKey: ["shared-design", token] as const,
    queryFn: async () => {
      const response = await axiosInstance.get<Design>(`/sharing/by-token/${token}`);
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};
