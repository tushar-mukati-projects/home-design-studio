import { z } from "zod";

const designId = z.object({ id: z.string().uuid() });
const permission = z.enum(["readonly", "readwrite"]).optional();

export const addMemberSchema = z.object({
  params: designId,
  body: z.object({ email: z.string().email(), permission }),
});

export const removeMemberSchema = z.object({
  params: z.object({ id: z.string().uuid(), memberId: z.string().uuid() }),
});

export const listAccessSchema = z.object({ params: designId });

export const createLinkSchema = z.object({
  params: designId,
  body: z.object({ permission, expiresAt: z.string().datetime().optional() }),
});

export const revokeLinkSchema = z.object({
  params: z.object({ id: z.string().uuid(), linkId: z.string().uuid() }),
});

export const getByCodeSchema = z.object({
  params: z.object({ code: z.string().min(1) }),
});
