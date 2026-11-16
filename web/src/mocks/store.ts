import type { CatalogItem, DesignPermission } from "@/shared/canvas";
import type {
  Design,
  DesignLink,
  DesignListItem,
  DesignMember,
  DesignSummary,
  DesignTemplate,
  DesignVersion,
  DesignWithPermission,
} from "@/types";
import { DEMO_USER, OTHER_USER, SHARED_DESIGN_ID, mockDesigns } from "./data/designs";
import { mockFurnitureItems } from "./data/furniture";
import { mockTemplates } from "./data/templates";

export const designs: Design[] = structuredClone(mockDesigns);
export const furnitureItems: CatalogItem[] = structuredClone(mockFurnitureItems);
export const templates: DesignTemplate[] = structuredClone(mockTemplates);
export const versions: DesignVersion[] = [];
export const links: DesignLink[] = [];
export const members: DesignMember[] = [
  {
    id: "c1b2c3d4-0001-4000-8000-000000000001",
    designId: SHARED_DESIGN_ID,
    email: DEMO_USER.email,
    permission: "readwrite",
    createdAt: "2026-03-02T08:00:00.000Z",
  },
];

const ownerOf = (design: Design) => (design.userId === DEMO_USER.id ? DEMO_USER : OTHER_USER);

const permissionOf = (design: Design): DesignPermission =>
  design.userId === DEMO_USER.id
    ? "owner"
    : (members.find((m) => m.designId === design.id && m.email === DEMO_USER.email)?.permission ??
      "readonly");

export const summaryOf = (design: Design): DesignSummary => ({
  id: design.id,
  name: design.name,
  description: design.description,
  thumbnail: design.thumbnail,
  userId: design.userId,
  createdAt: design.createdAt,
  updatedAt: design.updatedAt,
  rooms: design.canvasData.rooms,
  furniture: design.canvasData.furniture,
});

export const listItemOf = (design: Design): DesignListItem => ({
  ...summaryOf(design),
  permission: permissionOf(design),
  ownerName: ownerOf(design).name,
  ownerEmail: ownerOf(design).email,
});

export const detailOf = (design: Design): DesignWithPermission => ({
  ...summaryOf(design),
  canvasData: design.canvasData,
  permission: permissionOf(design),
  ownerName: ownerOf(design).name,
});
