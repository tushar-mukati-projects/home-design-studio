import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { Design, DesignVersion } from "@/types";
import { API_ROUTES, QUERY_KEYS as DESIGN_QUERY_KEYS } from "./constants";

const VERSION_KEYS = {
  all: ["versions"] as const,
  list: (designId: string) => [...VERSION_KEYS.all, designId] as const,
};

export const useFetchVersions = (designId: string) =>
  useQuery({
    queryKey: VERSION_KEYS.list(designId),
    queryFn: async () =>
      (await axiosInstance.get<DesignVersion[]>(API_ROUTES.versions(designId))).data,
    enabled: !!designId,
  });

export const useCreateVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name?: string) =>
      (await axiosInstance.post<DesignVersion>(API_ROUTES.versions(designId), { name })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) }),
  });
};

export const useRestoreVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) =>
      (await axiosInstance.post<Design>(API_ROUTES.restoreVersion(designId, versionId))).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) });
      qc.invalidateQueries({ queryKey: DESIGN_QUERY_KEYS.detail(designId) });
    },
  });
};

export const useDeleteVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      await axiosInstance.delete(API_ROUTES.version(designId, versionId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) }),
  });
};
