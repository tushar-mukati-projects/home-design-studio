import type { Canvas } from "@/shared/canvas";
import type { Design } from "@/types";

export const DEMO_USER = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Demo User",
  email: "demo@example.com",
};

export const OTHER_USER = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Priya Shah",
  email: "priya@example.com",
};

type MockDesignInput = {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  canvasData: Canvas;
  createdAt: string;
  updatedAt: string;
};

export const mockDesign = (input: MockDesignInput): Design => ({
  ...input,
  thumbnail: null,
  rooms: input.canvasData.rooms,
  furniture: input.canvasData.furniture,
});

const livingSpace: Canvas = {
  version: 1,
  units: "mm",
  walls: [
    { id: "w1", from: [0, 0], to: [6000, 0], thickness: 150, height: 2700 },
    { id: "w2", from: [6000, 0], to: [6000, 5000], thickness: 150, height: 2700 },
    { id: "w3", from: [6000, 5000], to: [0, 5000], thickness: 150, height: 2700 },
    { id: "w4", from: [0, 5000], to: [0, 0], thickness: 150, height: 2700 },
    { id: "w5", from: [3500, 0], to: [3500, 2500], thickness: 120, height: 2700 },
  ],
  openings: [
    {
      id: "d1",
      kind: "door",
      wall: "w5",
      offset: 1700,
      width: 900,
      height: 2100,
      variant: "single",
      hinge: "left",
      swing: "in",
    },
    { id: "win1", kind: "window", wall: "w1", offset: 1800, width: 1200, height: 1200, sill: 900 },
  ],
  rooms: [
    {
      id: "r1",
      name: "Living Room",
      usage: "living_room",
      polygon: [
        [0, 0],
        [3500, 0],
        [3500, 2500],
        [0, 2500],
      ],
    },
    {
      id: "r2",
      name: "Kitchen",
      usage: "kitchen",
      polygon: [
        [3500, 0],
        [6000, 0],
        [6000, 2500],
        [3500, 2500],
      ],
    },
  ],
  furniture: [
    { id: "f1", item: "sofa", at: [1750, 1900], rotation: 0 },
    { id: "f2", item: "coffee-table", at: [1750, 1000], rotation: 0 },
    { id: "f3", item: "refrigerator", at: [5500, 600], rotation: 0 },
  ],
};

const studio: Canvas = {
  version: 1,
  units: "mm",
  walls: [
    { id: "w1", from: [0, 0], to: [4000, 0], thickness: 120, height: 2700 },
    { id: "w2", from: [4000, 0], to: [4000, 3500], thickness: 120, height: 2700 },
    { id: "w3", from: [4000, 3500], to: [0, 3500], thickness: 120, height: 2700 },
    { id: "w4", from: [0, 3500], to: [0, 0], thickness: 120, height: 2700 },
  ],
  openings: [],
  rooms: [
    {
      id: "r1",
      name: "Bedroom",
      usage: "bedroom",
      polygon: [
        [0, 0],
        [4000, 0],
        [4000, 3500],
        [0, 3500],
      ],
    },
  ],
  furniture: [{ id: "f1", item: "double-bed", at: [2000, 1200], rotation: 0 }],
};

export const SHARED_DESIGN_ID = "a1b2c3d4-0003-4000-8000-000000000003";

export const mockDesigns: Design[] = [
  mockDesign({
    id: "a1b2c3d4-0001-4000-8000-000000000001",
    name: "Modern Living Space",
    description: "An open-concept living area with kitchen and dining",
    userId: DEMO_USER.id,
    canvasData: livingSpace,
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  }),
  mockDesign({
    id: "a1b2c3d4-0002-4000-8000-000000000002",
    name: "Studio Apartment",
    description: null,
    userId: DEMO_USER.id,
    canvasData: studio,
    createdAt: "2026-02-10T09:00:00.000Z",
    updatedAt: "2026-02-12T18:30:00.000Z",
  }),
  mockDesign({
    id: SHARED_DESIGN_ID,
    name: "Priya's Loft",
    description: "Shared for feedback",
    userId: OTHER_USER.id,
    canvasData: studio,
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-05T11:00:00.000Z",
  }),
];
