import type {
  Canvas,
  DesignPermission,
  Furniture,
  PlanName,
  Room,
  SharePermission,
} from "@/shared/canvas";

export type DesignSummary = {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  rooms: Room[];
  furniture: Furniture[];
};

export type Design = DesignSummary & { canvasData: Canvas };

export type DesignWithPermission = Design & {
  permission: DesignPermission;
  ownerName: string | null;
};

export type DesignListItem = DesignSummary & {
  permission: DesignPermission;
  ownerName: string | null;
  ownerEmail: string | null;
};

export type DesignListResponse = {
  designs: DesignListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type DesignTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  thumbnail: string | null;
  canvasData: Canvas;
  sortOrder: number;
};

export type DesignVersion = {
  id: string;
  name: string;
  canvasData: Canvas;
  designId: string;
  createdById: string | null;
  createdAt: string;
};

export type DesignMember = {
  id: string;
  designId: string;
  email: string;
  permission: SharePermission;
  createdAt: string;
};

export type DesignLink = {
  id: string;
  designId: string;
  code: string;
  permission: SharePermission;
  expiresAt: string | null;
  createdAt: string;
};

export type DesignAccess = {
  members: DesignMember[];
  links: DesignLink[];
};

export type PlanStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete";

export type Plan = {
  plan: PlanName;
  canCreateDesign: boolean;
  canShare: boolean;
  canUseAI: boolean;
  designLimit: number | null;
  designCount: number;
  status: PlanStatus | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type EditorTool = "select" | "wall" | "door" | "window" | "eraser" | "pan";

export type Point = {
  x: number;
  y: number;
};
