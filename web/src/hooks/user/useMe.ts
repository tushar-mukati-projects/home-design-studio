import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { PlanName } from "@/shared/canvas";
import { USER_API_ROUTES, USER_QUERY_KEYS } from "./constants";

const ME_STALE_TIME_MS = 5 * 60 * 1000;

type Me = {
  id: string;
  email: string | null;
  name: string | null;
  plan: PlanName;
  createdAt: string;
};

export const useMe = (enabled: boolean) =>
  useQuery({
    queryKey: USER_QUERY_KEYS.me,
    queryFn: async () => (await axiosInstance.get<Me>(USER_API_ROUTES.me)).data,
    enabled,
    staleTime: ME_STALE_TIME_MS,
  });
