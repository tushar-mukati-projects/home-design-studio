import type { DesignTemplate } from "@/types";

export const mockTemplates: DesignTemplate[] = [
  {
    id: "b1b2c3d4-0001-4000-8000-000000000001",
    name: "One-bedroom Apartment",
    description: "Bedroom, bathroom and an open living area",
    category: "apartment",
    thumbnail: null,
    sortOrder: 1,
    canvasData: {
      version: 1,
      units: "mm",
      walls: [
        { id: "w1", from: [0, 0], to: [8000, 0], thickness: 150, height: 2700 },
        { id: "w2", from: [8000, 0], to: [8000, 6000], thickness: 150, height: 2700 },
        { id: "w3", from: [8000, 6000], to: [0, 6000], thickness: 150, height: 2700 },
        { id: "w4", from: [0, 6000], to: [0, 0], thickness: 150, height: 2700 },
        { id: "w5", from: [4000, 0], to: [4000, 6000], thickness: 120, height: 2700 },
      ],
      openings: [
        { id: "d1", kind: "door", wall: "w5", offset: 2500, width: 900, height: 2100 },
        {
          id: "win1",
          kind: "window",
          wall: "w1",
          offset: 1500,
          width: 1500,
          height: 1200,
          sill: 900,
        },
      ],
      rooms: [
        {
          id: "r1",
          name: "Living Room",
          usage: "living_room",
          polygon: [
            [0, 0],
            [4000, 0],
            [4000, 6000],
            [0, 6000],
          ],
        },
        {
          id: "r2",
          name: "Bedroom",
          usage: "bedroom",
          polygon: [
            [4000, 0],
            [8000, 0],
            [8000, 6000],
            [4000, 6000],
          ],
        },
      ],
      furniture: [
        { id: "f1", item: "sofa", at: [2000, 4500], rotation: 0 },
        { id: "f2", item: "double-bed", at: [6000, 2000], rotation: 0 },
      ],
    },
  },
  {
    id: "b1b2c3d4-0002-4000-8000-000000000002",
    name: "Small Office",
    description: "Two desks and a meeting corner",
    category: "office",
    thumbnail: null,
    sortOrder: 2,
    canvasData: {
      version: 1,
      units: "mm",
      walls: [
        { id: "w1", from: [0, 0], to: [6000, 0], thickness: 120, height: 2700 },
        { id: "w2", from: [6000, 0], to: [6000, 4500], thickness: 120, height: 2700 },
        { id: "w3", from: [6000, 4500], to: [0, 4500], thickness: 120, height: 2700 },
        { id: "w4", from: [0, 4500], to: [0, 0], thickness: 120, height: 2700 },
      ],
      openings: [{ id: "d1", kind: "door", wall: "w3", offset: 500, width: 900, height: 2100 }],
      rooms: [
        {
          id: "r1",
          name: "Office",
          usage: "office",
          polygon: [
            [0, 0],
            [6000, 0],
            [6000, 4500],
            [0, 4500],
          ],
        },
      ],
      furniture: [
        { id: "f1", item: "office-desk", at: [1500, 1000], rotation: 0 },
        { id: "f2", item: "office-desk", at: [4500, 1000], rotation: 0 },
      ],
    },
  },
];
