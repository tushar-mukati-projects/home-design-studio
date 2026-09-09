import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { USER_API_ROUTES, USER_QUERY_KEYS } from "./constants";

export interface Me {
  id: string;
  email: string | null;
  name: string | null;
  plan: "free" | "pro";
  createdAt: string;
}

export const useMe = (enabled = true) =>
  useQuery({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: async () => {
      const response = await axiosInstance.get<Me>(USER_API_ROUTES.me);
      return response.data;
    },
    enabled,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
