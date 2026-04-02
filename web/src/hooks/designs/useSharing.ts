import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";

const SHARE_KEYS = {
  shares: (designId: string) => ["shares", designId] as const,
  sharedWithMe: ["shared-with-me"] as const,
};

interface DesignShareItem {
  id: string;
  sharedWithEmail: string;
  sharedWithId: string | null;
  permission: string;
  createdAt: string;
}

interface SharesResponse {
  shares: DesignShareItem[];
  shareToken: string | null;
  shareLinkAccess: string | null;
}

interface ShareDesignParams {
  email: string;
  permission: string;
}

interface ToggleShareLinkParams {
  enabled: boolean;
  access: string;
}

interface ToggleShareLinkResponse {
  shareToken: string | null;
  shareLinkAccess: string | null;
}

interface SharedDesignItem {
  id: string;
  permission: string;
  createdAt: string;
  design: import("@/types").Design;
  ownerName: string;
  ownerEmail: string;
}

export const useDesignShares = (designId: string) => {
  return useQuery({
    queryKey: SHARE_KEYS.shares(designId),
    queryFn: async () => {
      const res = await axiosInstance.get<SharesResponse>(`/sharing/${designId}/shares`);
      return res.data;
    },
    enabled: !!designId,
  });
};

export const useShareDesign = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, permission }: ShareDesignParams) => {
      const res = await axiosInstance.post(`/sharing/${designId}/share`, { email, permission });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_KEYS.shares(designId) }),
  });
};

export const useRevokeShare = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (shareId: string) => {
      await axiosInstance.delete(`/sharing/${designId}/shares/${shareId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_KEYS.shares(designId) }),
  });
};

export const useToggleShareLink = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ enabled, access }: ToggleShareLinkParams) => {
      const res = await axiosInstance.post(`/sharing/${designId}/share-link`, { enabled, access });
      return res.data as ToggleShareLinkResponse;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SHARE_KEYS.shares(designId) }),
  });
};

export const useSharedWithMe = () => {
  return useQuery({
    queryKey: SHARE_KEYS.sharedWithMe,
    queryFn: async () => {
      const res = await axiosInstance.get<SharedDesignItem[]>("/sharing/shared-with-me");
      return res.data;
    },
  });
};
