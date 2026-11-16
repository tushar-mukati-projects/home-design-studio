import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/lib/auth-context";
import type { Plan } from "@/types";
import { BILLING_API_ROUTES, BILLING_QUERY_KEYS } from "./constants";

export const useFetchPlan = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.plan,
    enabled: !!user,
    queryFn: async () => (await axiosInstance.get<Plan>(BILLING_API_ROUTES.plan)).data,
  });
};
