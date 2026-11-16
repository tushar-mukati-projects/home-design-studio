import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import type { SharePermission } from "@/shared/canvas";
import type { DesignAccess, DesignLink, DesignMember } from "@/types";
import { API_ROUTES } from "./constants";

type AddMemberParams = {
  email: string;
  permission: SharePermission;
};

type CreateLinkParams = {
  permission: SharePermission;
};

const SHARE_KEYS = {
  access: (designId: string) => ["design-access", designId] as const,
};

export const useDesignAccess = (designId: string) =>
  useQuery({
    queryKey: SHARE_KEYS.access(designId),
    queryFn: async () => (await axiosInstance.get<DesignAccess>(API_ROUTES.access(designId))).data,
    enabled: !!designId,
  });

const invalidateAccess = (qc: ReturnType<typeof useQueryClient>, designId: string) => () =>
  qc.invalidateQueries({ queryKey: SHARE_KEYS.access(designId) });

export const useAddMember = (designId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: AddMemberParams) =>
      (await axiosInstance.post<DesignMember>(API_ROUTES.members(designId), params)).data,
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
    mutationFn: async (params: CreateLinkParams) =>
      (await axiosInstance.post<DesignLink>(API_ROUTES.links(designId), params)).data,
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
