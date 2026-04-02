import type { Room } from "@/types";

export const mockRooms: Room[] = [
  {
    id: "room_01",
    name: "Living Room",
    type: "living-room",
    color: "#D4A85330",
    points: [
      { x: 50, y: 50 },
      { x: 400, y: 50 },
      { x: 400, y: 350 },
      { x: 50, y: 350 },
    ],
    area: 10.5,
  },
  {
    id: "room_02",
    name: "Bedroom",
    type: "bedroom",
    color: "#6B8E8630",
    points: [
      { x: 400, y: 50 },
      { x: 650, y: 50 },
      { x: 650, y: 300 },
      { x: 400, y: 300 },
    ],
    area: 7.5,
  },
  {
    id: "room_03",
    name: "Kitchen",
    type: "kitchen",
    color: "#CD853F30",
    points: [
      { x: 50, y: 350 },
      { x: 300, y: 350 },
      { x: 300, y: 550 },
      { x: 50, y: 550 },
    ],
    area: 5.0,
  },
  {
    id: "room_04",
    name: "Bathroom",
    type: "bathroom",
    color: "#87CEEB30",
    points: [
      { x: 400, y: 300 },
      { x: 550, y: 300 },
      { x: 550, y: 450 },
      { x: 400, y: 450 },
    ],
    area: 2.25,
  },
];
