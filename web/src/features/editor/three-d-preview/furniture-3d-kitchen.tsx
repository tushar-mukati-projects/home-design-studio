"use client";

import { RoundedBox, Cylinder } from "@react-three/drei";
import { CHROME, CornerLegs, type ModelProps, type PieceProps } from "./furniture-3d-parts";

export const KITCHEN_ITEMS = [
  "dining-table",
  "dining-chair",
  "kitchen-island",
  "refrigerator",
  "stove",
];

const CHAIR_SLAT_FRACTIONS = [-0.22, 0, 0.22];

export const KitchenModel = ({ item, ...piece }: ModelProps) => {
  switch (item) {
    case "dining-table":
      return <DiningTable {...piece} />;
    case "dining-chair":
      return <DiningChair {...piece} />;
    case "kitchen-island":
      return <KitchenIsland {...piece} />;
    case "refrigerator":
      return <Refrigerator {...piece} />;
    case "stove":
      return <Stove {...piece} />;
    default:
      return null;
  }
};

const DiningTable = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.06, d]}
      radius={0.015}
      smoothness={4}
      position={[0, h * 0.97, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <CornerLegs w={w} d={d} legH={h * 0.94} radius={0.02} material={darker} />
  </>
);

const DiningChair = ({ w, h, d, materials: { base, darker } }: PieceProps) => {
  const seatY = h * 0.45;
  const seatH = h * 0.06;

  return (
    <>
      <RoundedBox
        args={[w * 0.88, seatH, d * 0.7]}
        radius={0.015}
        smoothness={3}
        position={[0, seatY, 0]}
        castShadow
        receiveShadow
        material={base}
      />
      {CHAIR_SLAT_FRACTIONS.map((frac) => (
        <RoundedBox
          key={frac}
          args={[w * 0.12, h * 0.38, 0.018]}
          radius={0.006}
          smoothness={3}
          position={[frac * w * 0.8, h * 0.68, -d * 0.32]}
          castShadow
          material={darker}
        />
      ))}
      <RoundedBox
        args={[w * 0.82, h * 0.04, 0.022]}
        radius={0.006}
        smoothness={3}
        position={[0, h * 0.89, -d * 0.32]}
        castShadow
        material={darker}
      />
      <CornerLegs
        w={w * 0.9}
        d={d * 0.7}
        legH={seatY - seatH / 2}
        radius={0.015}
        material={darker}
        insetX={0.05}
        insetZ={0.05}
      />
    </>
  );
};

const KitchenIsland = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.82, d]}
      radius={0.02}
      smoothness={4}
      position={[0, h * 0.47, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <CornerLegs
      w={w}
      d={d}
      legH={h * 0.08}
      radius={0.015}
      material={darker}
      insetX={0.05}
      insetZ={0.05}
    />
    <RoundedBox
      args={[w * 1.04, h * 0.04, d * 1.04]}
      radius={0.012}
      smoothness={3}
      position={[0, h * 0.92, 0]}
      castShadow
      receiveShadow
      material={darker}
    />
  </>
);

const Refrigerator = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h, d]}
      radius={0.02}
      smoothness={3}
      position={[0, h / 2, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <mesh position={[0, h * 0.65, d * 0.505]} material={darker}>
      <boxGeometry args={[w * 0.98, 0.008, 0.008]} />
    </mesh>
    <Cylinder
      args={[0.008, 0.008, h * 0.2, 8]}
      position={[w * 0.42, h * 0.78, d * 0.54]}
      material={CHROME}
    />
    <Cylinder
      args={[0.008, 0.008, h * 0.28, 8]}
      position={[w * 0.42, h * 0.4, d * 0.54]}
      material={CHROME}
    />
  </>
);

const Stove = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => {
  const burnerPositions: [number, number, number][] = [
    [-w * 0.2, h * 0.93, -d * 0.2],
    [w * 0.2, h * 0.93, -d * 0.2],
    [-w * 0.2, h * 0.93, d * 0.2],
    [w * 0.2, h * 0.93, d * 0.2],
  ];
  return (
    <>
      <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow material={base}>
        <boxGeometry args={[w, h * 0.9, d]} />
      </mesh>
      <mesh position={[0, h * 0.915, 0]} castShadow receiveShadow material={darker}>
        <boxGeometry args={[w * 1.01, h * 0.03, d * 1.01]} />
      </mesh>
      {burnerPositions.map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} material={lighter}>
          <torusGeometry args={[0.06, 0.008, 8, 24]} />
        </mesh>
      ))}
      <Cylinder
        args={[0.006, 0.006, w * 0.5, 8]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, h * 0.6, d * 0.52]}
        material={CHROME}
      />
    </>
  );
};
