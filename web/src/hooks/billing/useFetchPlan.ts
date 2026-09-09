import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { useAuth } from "@/lib/auth-context";
import { BILLING_API_ROUTES, BILLING_QUERY_KEYS } from "./constants";

interface PlanResponse {
  plan: string;
  canCreateDesign: boolean;
  canShare: boolean;
  canUseAI: boolean;

  designLimit: number | null;
  designCount: number;
}

export const useFetchPlan = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: BILLING_QUERY_KEYS.plan,
    enabled: !!user,
    queryFn: async () => {
      const response = await axiosInstance.get<PlanResponse>(BILLING_API_ROUTES.plan);
      return response.data;
    },
  });
};
