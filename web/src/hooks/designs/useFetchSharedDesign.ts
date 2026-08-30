import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design } from "@/types";

export const useFetchSharedDesign = (code: string) => {
  return useQuery({
    queryKey: ["shared-design", code] as const,
    queryFn: async () => {
      const response = await axiosInstance.get<Design>(`/sharing/by-code/${code}`);
      return response.data;
    },
    enabled: !!code,
    retry: false,
  });
};
