import { prisma } from "../db";
import { logger } from "../logger";
import { serializeDesign } from "../utils";
import type { Prisma } from "@prisma/client";

interface TemplateCanvasData {
  walls: Array<{
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
    color: string;
  }>;
  doors: Array<{
    id: string;
    wallId: string;
    position: number;
    width: number;
    type: string;
  }>;
  windows: Array<{
    id: string;
    wallId: string;
    position: number;
    width: number;
  }>;
  gridSize: number;
  zoom: number;
  panX: number;
  panY: number;
}

interface TemplateData {
  name: string;
  description: string;
  category: string;
  canvasData: TemplateCanvasData;
  width: number;
  height: number;
  sortOrder: number;
}

const designInclude = {
  rooms: true,
  furniture: {
    include: {
      furnitureItem: true,
    },
  },
} satisfies Prisma.DesignInclude;

const DEFAULT_TEMPLATES: TemplateData[] = [
  {
    name: "Studio Apartment",
    description: "Compact open-plan studio with a door and two windows",
    category: "apartment",
    width: 400,
    height: 350,
    sortOrder: 0,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 380, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 380, y1: 20, x2: 380, y2: 330, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 380, y1: 330, x2: 20, y2: 330, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 330, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [{ id: "d1", wallId: "w3", position: 0.4, width: 80, type: "single" }],
      windows: [
        { id: "win1", wallId: "w2", position: 0.3, width: 60 },
        { id: "win2", wallId: "w2", position: 0.7, width: 60 },
      ],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
  {
    name: "One Bedroom (1BHK)",
    description: "Living area with a separate bedroom divided by an interior wall",
    category: "apartment",
    width: 600,
    height: 400,
    sortOrder: 1,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 580, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 580, y1: 20, x2: 580, y2: 380, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 580, y1: 380, x2: 20, y2: 380, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 380, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w5", x1: 350, y1: 20, x2: 350, y2: 380, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [
        { id: "d1", wallId: "w3", position: 0.2, width: 80, type: "single" },
        { id: "d2", wallId: "w5", position: 0.5, width: 80, type: "single" },
      ],
      windows: [
        { id: "win1", wallId: "w1", position: 0.25, width: 60 },
        { id: "win2", wallId: "w1", position: 0.75, width: 60 },
        { id: "win3", wallId: "w2", position: 0.5, width: 60 },
      ],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
  {
    name: "Two Bedroom (2BHK)",
    description: "Spacious layout with two bedrooms and a central living area",
    category: "apartment",
    width: 800,
    height: 500,
    sortOrder: 2,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 780, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 780, y1: 20, x2: 780, y2: 480, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 780, y1: 480, x2: 20, y2: 480, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 480, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w5", x1: 280, y1: 20, x2: 280, y2: 480, thickness: 8, color: "#6B5B4D" },
        { id: "w6", x1: 540, y1: 20, x2: 540, y2: 480, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [
        { id: "d1", wallId: "w3", position: 0.5, width: 80, type: "single" },
        { id: "d2", wallId: "w5", position: 0.5, width: 80, type: "single" },
        { id: "d3", wallId: "w6", position: 0.5, width: 80, type: "single" },
      ],
      windows: [
        { id: "win1", wallId: "w1", position: 0.15, width: 60 },
        { id: "win2", wallId: "w1", position: 0.5, width: 60 },
        { id: "win3", wallId: "w1", position: 0.85, width: 60 },
        { id: "win4", wallId: "w2", position: 0.5, width: 60 },
      ],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
  {
    name: "Kitchen Layout",
    description: "Standard kitchen space with a door and window",
    category: "kitchen",
    width: 300,
    height: 250,
    sortOrder: 3,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 280, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 280, y1: 20, x2: 280, y2: 230, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 280, y1: 230, x2: 20, y2: 230, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 230, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [{ id: "d1", wallId: "w3", position: 0.5, width: 80, type: "single" }],
      windows: [{ id: "win1", wallId: "w1", position: 0.5, width: 60 }],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
  {
    name: "Office Space",
    description: "Open office with a separate meeting room",
    category: "office",
    width: 500,
    height: 400,
    sortOrder: 4,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 480, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 480, y1: 20, x2: 480, y2: 380, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 480, y1: 380, x2: 20, y2: 380, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 380, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w5", x1: 320, y1: 20, x2: 320, y2: 250, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [
        { id: "d1", wallId: "w3", position: 0.25, width: 80, type: "single" },
        { id: "d2", wallId: "w5", position: 0.6, width: 80, type: "single" },
      ],
      windows: [
        { id: "win1", wallId: "w1", position: 0.3, width: 60 },
        { id: "win2", wallId: "w1", position: 0.7, width: 60 },
        { id: "win3", wallId: "w2", position: 0.5, width: 60 },
      ],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
  {
    name: "Bathroom",
    description: "Compact bathroom layout with a door and small window",
    category: "bathroom",
    width: 200,
    height: 200,
    sortOrder: 5,
    canvasData: {
      walls: [
        { id: "w1", x1: 20, y1: 20, x2: 180, y2: 20, thickness: 8, color: "#6B5B4D" },
        { id: "w2", x1: 180, y1: 20, x2: 180, y2: 180, thickness: 8, color: "#6B5B4D" },
        { id: "w3", x1: 180, y1: 180, x2: 20, y2: 180, thickness: 8, color: "#6B5B4D" },
        { id: "w4", x1: 20, y1: 180, x2: 20, y2: 20, thickness: 8, color: "#6B5B4D" },
      ],
      doors: [{ id: "d1", wallId: "w3", position: 0.5, width: 80, type: "single" }],
      windows: [{ id: "win1", wallId: "w1", position: 0.5, width: 40 }],
      gridSize: 20,
      zoom: 1,
      panX: 0,
      panY: 0,
    },
  },
];

export const listTemplates = async () => {
  const templates = await prisma.designTemplate.findMany({
    orderBy: { sortOrder: "asc" },
  });
  return templates;
};

export const getTemplate = async (id: string) => {
  const template = await prisma.designTemplate.findUnique({
    where: { id },
  });
  return template;
};

export const createDesignFromTemplate = async (
  templateId: string,
  userId: string,
  name: string,
) => {
  const template = await prisma.designTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return null;

  const design = await prisma.design.create({
    data: {
      name,
      description: template.description,
      canvasData: template.canvasData as Prisma.InputJsonValue,
      width: template.width,
      height: template.height,
      userId,
    },
    include: designInclude,
  });

  return serializeDesign(design);
};

export const seedTemplates = async () => {
  const existingCount = await prisma.designTemplate.count();

  if (existingCount >= DEFAULT_TEMPLATES.length) {
    logger.info("Design templates already seeded");
    return;
  }

  await prisma.designTemplate.deleteMany();

  await prisma.designTemplate.createMany({
    data: DEFAULT_TEMPLATES.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      canvasData: t.canvasData as unknown as Prisma.InputJsonValue,
      width: t.width,
      height: t.height,
      sortOrder: t.sortOrder,
    })),
  });

  logger.info(`Seeded ${DEFAULT_TEMPLATES.length} design templates`);
};
