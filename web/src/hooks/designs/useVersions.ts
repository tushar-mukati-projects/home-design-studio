import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const VERSION_KEYS = {
  all: ["versions"] as const,
  list: (designId: string) => [...VERSION_KEYS.all, designId] as const,
};

interface DesignVersion {
  id: string;
  designId: string;
  name: string;
  canvasData: unknown;
  rooms: unknown;
  furniture: unknown;
  createdBy: string;
  createdAt: string;
}

export const useFetchVersions = (designId: string) => {
  return useQuery({
    queryKey: VERSION_KEYS.list(designId),
    queryFn: async () => {
      const res = await axiosInstance.get<DesignVersion[]>(`/versions/${designId}`);
      return res.data;
    },
    enabled: !!designId,
  });
};

export const useCreateVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name?: string) => {
      const res = await axiosInstance.post<DesignVersion>(`/versions/${designId}`, {
        name,
      });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) }),
  });
};

export const useRestoreVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      const res = await axiosInstance.post(`/versions/${designId}/restore/${versionId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) });
      qc.invalidateQueries({ queryKey: ["designs", "detail", designId] });
    },
  });
};

export const useDeleteVersion = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (versionId: string) => {
      await axiosInstance.delete(`/versions/${versionId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: VERSION_KEYS.list(designId) }),
  });
};
