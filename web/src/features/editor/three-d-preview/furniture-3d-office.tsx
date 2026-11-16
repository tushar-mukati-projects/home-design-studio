"use client";

import { RoundedBox, Cylinder, Sphere } from "@react-three/drei";
import { CHROME, type ModelProps, type PieceProps } from "./furniture-3d-parts";

export const OFFICE_ITEMS = ["desk", "office-desk", "office-chair", "filing-cabinet"];

const CHAIR_STAR_ARMS = 5;
const CABINET_SEAM_FRACTIONS = [0.25, 0.5, 0.75];
const CABINET_HANDLE_FRACTIONS = [0.125, 0.375, 0.625, 0.875];

export const OfficeModel = ({ item, ...piece }: ModelProps) => {
  switch (item) {
    case "desk":
    case "office-desk":
      return <Desk {...piece} />;
    case "office-chair":
      return <OfficeChair {...piece} />;
    case "filing-cabinet":
      return <FilingCabinet {...piece} />;
    default:
      return null;
  }
};

const Desk = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <mesh position={[0, h * 0.97, 0]} castShadow receiveShadow material={base}>
      <boxGeometry args={[w, h * 0.06, d]} />
    </mesh>
    {[-1, 1].map((side) => (
      <mesh
        key={side}
        position={[side * w * 0.48, h * 0.47, 0]}
        castShadow
        receiveShadow
        material={darker}
      >
        <boxGeometry args={[w * 0.04, h * 0.94, d * 0.95]} />
      </mesh>
    ))}
    <mesh position={[0, h * 0.15, -d * 0.47]} receiveShadow material={darker}>
      <boxGeometry args={[w * 0.92, h * 0.3, 0.02]} />
    </mesh>
  </>
);

const OfficeChair = ({ w, h, d, materials: { base, darker } }: PieceProps) => {
  const starR = w * 0.38;
  const liftH = h * 0.32;
  const seatY = liftH + 0.03;

  return (
    <>
      {Array.from({ length: CHAIR_STAR_ARMS }, (_, i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / CHAIR_STAR_ARMS, 0]}>
          <Cylinder
            args={[0.012, 0.012, starR, 6]}
            position={[0, 0.015, starR / 2]}
            rotation={[Math.PI / 2, 0, 0]}
            material={darker}
          />
          <Sphere args={[0.018, 6, 6]} position={[0, 0.012, starR]} material={darker} />
        </group>
      ))}
      <Cylinder
        args={[0.02, 0.025, liftH, 8]}
        position={[0, liftH / 2 + 0.02, 0]}
        castShadow
        material={darker}
      />
      <RoundedBox
        args={[w * 0.82, h * 0.06, d * 0.7]}
        radius={0.025}
        smoothness={4}
        position={[0, seatY + h * 0.03, d * 0.02]}
        castShadow
        receiveShadow
        material={base}
      />
      <RoundedBox
        args={[w * 0.76, h * 0.35, 0.035]}
        radius={0.025}
        smoothness={4}
        position={[0, seatY + h * 0.24, -d * 0.32]}
        castShadow
        receiveShadow
        material={darker}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Cylinder
            args={[0.012, 0.012, h * 0.12, 8]}
            position={[side * w * 0.38, seatY + h * 0.09, -d * 0.05]}
            material={darker}
          />
          <RoundedBox
            args={[0.025, 0.015, d * 0.2]}
            radius={0.005}
            smoothness={3}
            position={[side * w * 0.38, seatY + h * 0.16, -d * 0.05]}
            material={darker}
          />
        </group>
      ))}
    </>
  );
};

const FilingCabinet = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
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
    {CABINET_SEAM_FRACTIONS.map((frac) => (
      <mesh key={frac} position={[0, h * frac, d * 0.505]} material={darker}>
        <boxGeometry args={[w * 0.8, 0.005, 0.005]} />
      </mesh>
    ))}
    {CABINET_HANDLE_FRACTIONS.map((frac) => (
      <Cylinder
        key={frac}
        args={[0.006, 0.006, w * 0.12, 8]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, h * frac, d * 0.53]}
        material={CHROME}
      />
    ))}
  </>
);
