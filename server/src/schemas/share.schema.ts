import { z } from "zod";
import { SHARE_PERMISSIONS } from "../shared/canvas";
import { designIdParams } from "./design.schema";

const EMAIL_MAX_CHARS = 254;

const permission = z.enum(SHARE_PERMISSIONS).default("readonly");
const futureDate = z
  .string()
  .datetime()
  .transform((value) => new Date(value))
  .refine((date) => date.getTime() > Date.now(), "must be in the future");

export const addMemberSchema = z.object({
  params: designIdParams,
  body: z.object({
    email: z.string().trim().toLowerCase().max(EMAIL_MAX_CHARS).email(),
    permission,
  }),
});

export const removeMemberSchema = z.object({
  params: designIdParams.extend({ memberId: z.string().uuid() }),
});

export const listAccessSchema = z.object({ params: designIdParams });

export const createLinkSchema = z.object({
  params: designIdParams,
  body: z.object({ permission, expiresAt: futureDate.optional() }),
});

export const revokeLinkSchema = z.object({
  params: designIdParams.extend({ linkId: z.string().uuid() }),
});

export type AddMemberBody = z.infer<typeof addMemberSchema>["body"];
export type CreateLinkBody = z.infer<typeof createLinkSchema>["body"];
