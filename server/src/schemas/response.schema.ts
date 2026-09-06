import { z } from "zod";
import { canvasSchema, catalogItemSchema, roomSchema, furnitureSchema } from "./canvas.schema";

const permission = z.enum(["readonly", "readwrite"]);
const isoDate = z.string().datetime();

export const errorResponse = z.object({ error: z.string() });

export const meResponse = z.object({
  id: z.string().uuid(),
  email: z.string().email().nullable(),
  name: z.string().nullable(),
  plan: z.enum(["free", "pro"]),
  createdAt: isoDate,
});
export const successResponse = z.object({ success: z.literal(true) });

export const designSummaryResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail: z.string().nullable(),
  userId: z.string().uuid(),
  createdAt: isoDate,
  updatedAt: isoDate,
  rooms: z.array(roomSchema),
  furniture: z.array(furnitureSchema),
});

export const designResponse = designSummaryResponse.extend({
  canvasData: canvasSchema,
});

export const designWithPermissionResponse = designResponse.extend({
  permission: z.enum(["owner", "readwrite", "readonly"]),
  ownerName: z.string().nullable(),
});

const designListItemResponse = designSummaryResponse.extend({
  permission: z.enum(["owner", "readwrite", "readonly"]),
  ownerName: z.string().nullable(),
  ownerEmail: z.string().nullable(),
});

export const designListResponse = z.object({
  designs: z.array(designListItemResponse),
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

export const furnitureItemResponse = catalogItemSchema;

export const furnitureListResponse = z.array(furnitureItemResponse);

const templateResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  thumbnail: z.string().nullable(),
  canvasData: canvasSchema,
  sortOrder: z.number().int(),
});

export const templateListResponse = z.array(templateResponse);

export const versionResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  canvasData: canvasSchema,
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
