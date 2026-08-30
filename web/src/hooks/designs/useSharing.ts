import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignSummary } from "@/types";

const SHARE_KEYS = {
  access: (designId: string) => ["design-access", designId] as const,
  sharedWithMe: ["shared-with-me"] as const,
};

export interface DesignMember {
  id: string;
  email: string;
  permission: "readonly" | "readwrite";
  createdAt: string;
}

export interface DesignLink {
  id: string;
  code: string;
  permission: "readonly" | "readwrite";
  expiresAt: string | null;
  createdAt: string;
}

interface AccessResponse {
  members: DesignMember[];
  links: DesignLink[];
}

interface SharedWithMeItem {
  id: string;
  permission: "readonly" | "readwrite";
  createdAt: string;
  design: DesignSummary;
  ownerName: string | null;
  ownerEmail: string | null;
}

export const useDesignAccess = (designId: string) =>
  useQuery({
    queryKey: SHARE_KEYS.access(designId),
    queryFn: async () => {
      const res = await axiosInstance.get<AccessResponse>(`/sharing/${designId}/access`);
      return res.data;
    },
    enabled: !!designId,
  });

const invalidateAccess = (qc: ReturnType<typeof useQueryClient>, designId: string) => () =>
  qc.invalidateQueries({ queryKey: SHARE_KEYS.access(designId) });

export const useAddMember = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { email: string; permission: string }) => {
      const res = await axiosInstance.post<DesignMember>(`/sharing/${designId}/members`, params);
      return res.data;
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useRemoveMember = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await axiosInstance.delete(`/sharing/${designId}/members/${memberId}`);
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useCreateLink = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { permission?: string; expiresAt?: string }) => {
      const res = await axiosInstance.post<DesignLink>(`/sharing/${designId}/links`, params);
      return res.data;
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useRevokeLink = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await axiosInstance.delete(`/sharing/${designId}/links/${linkId}`);
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useSharedWithMe = () =>
  useQuery({
    queryKey: SHARE_KEYS.sharedWithMe,
    queryFn: async () => {
      const res = await axiosInstance.get<SharedWithMeItem[]>("/sharing/shared-with-me");
      return res.data;
    },
  });
