import { z } from "zod";

const permission = z.enum(["readonly", "readwrite"]);
const isoDate = z.string().datetime();

export const errorResponse = z.object({ error: z.string() });
export const successResponse = z.object({ success: z.literal(true) });

const canvasElements = z.array(z.record(z.unknown()));

export const designSummaryResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  width: z.number(),
  height: z.number(),
  userId: z.string().uuid(),
  createdAt: isoDate,
  updatedAt: isoDate,
  rooms: canvasElements,
  furniture: canvasElements,
});

export const designResponse = designSummaryResponse.extend({
  canvasData: z.record(z.unknown()),
});

export const designWithPermissionResponse = designResponse.extend({
  permission: z.enum(["owner", "readwrite", "readonly"]),
});

export const designListResponse = z.object({
  designs: z.array(designSummaryResponse),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const furnitureItemResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  width: z.number(),
  height: z.number(),
  depth: z.number(),
  color: z.string(),
  icon: z.string().nullable(),
  description: z.string().nullable(),
  isDefault: z.boolean(),
});

export const furnitureListResponse = z.array(furnitureItemResponse);

export const templateResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  thumbnail: z.string().nullable(),
  canvasData: z.record(z.unknown()),
  width: z.number(),
  height: z.number(),
  sortOrder: z.number().int(),
});

export const templateListResponse = z.array(templateResponse);

export const versionResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  canvasData: z.record(z.unknown()),
  designId: z.string().uuid(),
  createdById: z.string().uuid().nullable(),
  createdAt: isoDate,
});

export const versionListResponse = z.array(versionResponse);

export const memberResponse = z.object({
  id: z.string().uuid(),
  designId: z.string().uuid(),
  email: z.string().email(),
  permission,
  createdAt: isoDate,
});

export const linkResponse = z.object({
  id: z.string().uuid(),
  designId: z.string().uuid(),
  code: z.string(),
  permission,
  expiresAt: isoDate.nullable(),
  createdAt: isoDate,
});

export const accessResponse = z.object({
  members: z.array(memberResponse),
  links: z.array(linkResponse),
});

export const sharedDesignResponse = designResponse.extend({
  ownerName: z.string().nullable(),
  permission,
});

export const sharedWithMeResponse = z.array(
  z.object({
    id: z.string().uuid(),
    permission,
    createdAt: isoDate,
    design: designSummaryResponse,
    ownerName: z.string().nullable(),
    ownerEmail: z.string().nullable(),
  }),
);

export const planResponse = z.object({
  plan: z.enum(["free", "pro"]),
  canCreateDesign: z.boolean(),
  canShare: z.boolean(),
  canUseAI: z.boolean(),
  designLimit: z.number().int().nullable(),
  designCount: z.number().int(),
  status: z.enum(["active", "trialing", "past_due", "canceled", "incomplete"]).nullable(),
  currentPeriodEnd: isoDate.nullable(),
  cancelAtPeriodEnd: z.boolean(),
});

export const checkoutResponse = z.object({ url: z.string().nullable() });
export const webhookResponse = z.object({ received: z.literal(true) });

export const healthResponse = z.object({ status: z.literal("ok"), timestamp: isoDate });
