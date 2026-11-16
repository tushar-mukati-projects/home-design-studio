"use client";

import { RoundedBox, Cylinder } from "@react-three/drei";
import { BOOK_MATS, CornerLegs, type ModelProps, type PieceProps } from "./furniture-3d-parts";
import { Armchair, Sofa } from "./furniture-3d-seating";

export const LIVING_ROOM_ITEMS = [
  "sofa",
  "armchair",
  "coffee-table",
  "tv-stand",
  "bookshelf",
  "bookcase",
  "floor-lamp",
];

const SHELF_FRACTIONS = [0.25, 0.5, 0.75];
const BOOK_ROWS = [
  {
    bottom: 0,
    books: [
      { x: -0.3, bw: 0.2, bh: 0.19 },
      { x: -0.05, bw: 0.22, bh: 0.21 },
      { x: 0.2, bw: 0.18, bh: 0.17 },
    ],
  },
  {
    bottom: 0.25,
    books: [
      { x: -0.25, bw: 0.24, bh: 0.2 },
      { x: 0.05, bw: 0.16, bh: 0.18 },
      { x: 0.28, bw: 0.2, bh: 0.22 },
    ],
  },
  {
    bottom: 0.5,
    books: [
      { x: -0.28, bw: 0.18, bh: 0.18 },
      { x: -0.04, bw: 0.2, bh: 0.21 },
      { x: 0.22, bw: 0.22, bh: 0.19 },
    ],
  },
];

export const LivingRoomModel = ({ item, ...piece }: ModelProps) => {
  switch (item) {
    case "sofa":
      return <Sofa {...piece} />;
    case "armchair":
      return <Armchair {...piece} />;
    case "coffee-table":
      return <CoffeeTable {...piece} />;
    case "tv-stand":
      return <TvStand {...piece} />;
    case "bookshelf":
    case "bookcase":
      return <Bookshelf {...piece} />;
    case "floor-lamp":
      return <FloorLamp {...piece} />;
    default:
      return null;
  }
};

const CoffeeTable = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.08, d]}
      radius={0.02}
      smoothness={4}
      position={[0, h * 0.92, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow material={lighter}>
      <boxGeometry args={[w * 0.85, h * 0.04, d * 0.85]} />
    </mesh>
    <CornerLegs w={w} d={d} legH={h * 0.88} radius={0.015} material={darker} />
  </>
);

const TvStand = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.68, d]}
      radius={0.02}
      smoothness={3}
      position={[0, h * 0.36, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <mesh position={[0, h * 0.72, 0]} castShadow receiveShadow material={darker}>
      <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
    </mesh>
    <mesh position={[0, h * 0.35, d * 0.3]} material={darker}>
      <boxGeometry args={[w * 0.8, h * 0.25, d * 0.4]} />
    </mesh>
  </>
);

const Bookshelf = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h, d]}
      radius={0.02}
      smoothness={4}
      position={[0, h / 2, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    {SHELF_FRACTIONS.map((frac) => (
      <mesh key={frac} position={[0, h * frac, 0]} material={darker}>
        <boxGeometry args={[w * 0.95, 0.015, d * 0.95]} />
      </mesh>
    ))}
    {BOOK_ROWS.map((row, si) =>
      row.books.map((b, bi) => (
        <mesh
          key={`${si}-${bi}`}
          position={[b.x * w, h * row.bottom + 0.01 + (h * b.bh) / 2, 0]}
          material={BOOK_MATS[(si * 3 + bi) % BOOK_MATS.length]}
        >
          <boxGeometry args={[w * b.bw, h * b.bh, d * 0.75]} />
        </mesh>
      )),
    )}
  </>
);

const FloorLamp = ({ w, h, materials: { darker, lighter } }: PieceProps) => (
  <>
    <Cylinder
      args={[w * 0.4, w * 0.4, h * 0.03, 16]}
      position={[0, h * 0.015, 0]}
      castShadow
      receiveShadow
      material={darker}
    />
    <Cylinder
      args={[0.015, 0.015, h * 0.85, 8]}
      position={[0, h * 0.45, 0]}
      castShadow
      material={darker}
    />
    <Cylinder
      args={[w * 0.3, w * 0.15, h * 0.15, 16]}
      position={[0, h * 0.9, 0]}
      castShadow
      material={lighter}
    />
  </>
);
