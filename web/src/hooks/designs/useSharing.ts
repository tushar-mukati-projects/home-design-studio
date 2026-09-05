import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { DesignListItem } from "@/types";
import { API_ROUTES, QUERY_KEYS } from "./constants";

const SHARE_KEYS = {
  access: (designId: string) => ["design-access", designId] as const,
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

interface DesignsResponse {
  designs: DesignListItem[];
}

export const useDesignAccess = (designId: string) =>
  useQuery({
    queryKey: SHARE_KEYS.access(designId),
    queryFn: async () => {
      const res = await axiosInstance.get<AccessResponse>(API_ROUTES.access(designId));
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
      const res = await axiosInstance.post<DesignMember>(API_ROUTES.members(designId), params);
      return res.data;
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useRemoveMember = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      await axiosInstance.delete(API_ROUTES.member(designId, memberId));
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useCreateLink = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { permission?: string; expiresAt?: string }) => {
      const res = await axiosInstance.post<DesignLink>(API_ROUTES.links(designId), params);
      return res.data;
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useRevokeLink = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await axiosInstance.delete(API_ROUTES.link(designId, linkId));
    },
    onSuccess: invalidateAccess(qc, designId),
  });
};

export const useSharedWithMe = () =>
  useQuery({
    queryKey: QUERY_KEYS.list({ scope: "shared" }),
    queryFn: async () => {
      const res = await axiosInstance.get<DesignsResponse>(API_ROUTES.designs, {
        params: { scope: "shared" },
      });
      return res.data.designs;
    },
  });
