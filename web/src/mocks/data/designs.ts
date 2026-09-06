import type { Design } from "@/types";

export const mockDesigns: Design[] = [
  {
    id: "design_01",
    name: "Modern Living Space",
    description: "An open-concept living area with kitchen and dining",
    thumbnail: null,
    canvasData: {
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
        {
          id: "win1",
          kind: "window",
          wall: "w1",
          offset: 1800,
          width: 1200,
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
    },
    rooms: [],
    furniture: [],
    createdAt: "2026-01-15T10:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
  },
];

for (const d of mockDesigns) {
  d.rooms = d.canvasData.rooms;
  d.furniture = d.canvasData.furniture;
}
