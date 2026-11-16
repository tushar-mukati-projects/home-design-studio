"use client";

import { RoundedBox, Cylinder } from "@react-three/drei";
import { CHROME, GLASS, type ModelProps, type PieceProps } from "./furniture-3d-parts";

export const BATHROOM_ITEMS = ["bathtub", "toilet", "sink", "shower"];

export const BathroomModel = ({ item, ...piece }: ModelProps) => {
  switch (item) {
    case "bathtub":
      return <Bathtub {...piece} />;
    case "toilet":
      return <Toilet {...piece} />;
    case "sink":
      return <Sink {...piece} />;
    case "shower":
      return <Shower {...piece} />;
    default:
      return null;
  }
};

const Bathtub = ({ w, h, d, materials: { base, lighter } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h, d]}
      radius={0.06}
      smoothness={4}
      position={[0, h / 2, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <RoundedBox
      args={[w * 0.88, h * 0.45, d * 0.82]}
      radius={0.04}
      smoothness={4}
      position={[0, h * 0.55, 0]}
      material={lighter}
    />
    <mesh position={[0, h * 0.99, 0]} material={lighter}>
      <boxGeometry args={[w * 0.99, h * 0.03, d * 0.99]} />
    </mesh>
    <Cylinder
      args={[0.015, 0.015, h * 0.25, 8]}
      position={[w * 0.35, h + h * 0.12, -d * 0.35]}
      castShadow
      material={CHROME}
    />
    <Cylinder
      args={[0.012, 0.012, 0.08, 8]}
      rotation={[Math.PI * 0.35, 0, 0]}
      position={[w * 0.35, h + h * 0.22, -d * 0.3]}
      castShadow
      material={CHROME}
    />
  </>
);

const Toilet = ({ w, h, d, materials: { base, lighter } }: PieceProps) => {
  const bowlR = w * 0.38;

  return (
    <>
      <RoundedBox
        args={[w * 0.82, h * 0.65, d * 0.2]}
        radius={0.025}
        smoothness={4}
        position={[0, h * 0.325, -d * 0.38]}
        castShadow
        receiveShadow
        material={base}
      />
      <RoundedBox
        args={[w * 0.85, h * 0.06, d * 0.22]}
        radius={0.015}
        smoothness={3}
        position={[0, h * 0.68, -d * 0.38]}
        castShadow
        material={lighter}
      />
      <RoundedBox
        args={[w * 0.48, h * 0.22, d * 0.18]}
        radius={0.015}
        smoothness={3}
        position={[0, h * 0.18, -d * 0.18]}
        material={base}
      />
      <Cylinder
        args={[bowlR, bowlR * 0.7, h * 0.35, 20]}
        position={[0, h * 0.175, d * 0.12]}
        castShadow
        receiveShadow
        material={base}
      />
      <Cylinder
        args={[bowlR * 1.05, bowlR * 1.05, h * 0.04, 20]}
        position={[0, h * 0.375, d * 0.12]}
        castShadow
        material={lighter}
      />
      <Cylinder
        args={[0.015, 0.015, 0.008, 12]}
        position={[0, h * 0.72, -d * 0.38]}
        material={CHROME}
      />
    </>
  );
};

const Sink = ({ w, h, d, materials: { base, lighter } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.82, d]}
      radius={0.02}
      smoothness={3}
      position={[0, h * 0.41, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <mesh position={[0, h * 0.84, 0]} castShadow receiveShadow material={lighter}>
      <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
    </mesh>
    <Cylinder
      args={[w * 0.28, w * 0.22, h * 0.08, 20]}
      position={[0, h * 0.82, d * 0.08]}
      material={lighter}
    />
    <Cylinder
      args={[0.018, 0.018, h * 0.12, 8]}
      position={[0, h * 0.92, -d * 0.28]}
      castShadow
      material={CHROME}
    />
    <Cylinder
      args={[0.01, 0.01, d * 0.18, 8]}
      rotation={[Math.PI * 0.4, 0, 0]}
      position={[0, h * 0.98, -d * 0.18]}
      castShadow
      material={CHROME}
    />
    <Cylinder
      args={[0.006, 0.006, w * 0.1, 8]}
      rotation={[0, 0, Math.PI / 2]}
      position={[0, h * 0.5, d * 0.52]}
      material={CHROME}
    />
  </>
);

const Shower = ({ w, h, d, materials: { base, lighter } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.02, d]}
      radius={0.01}
      smoothness={3}
      position={[0, h * 0.01, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <mesh position={[-w * 0.49, h * 0.5, 0]} material={lighter}>
      <boxGeometry args={[0.02, h, d]} />
    </mesh>
    <mesh position={[0, h * 0.5, -d * 0.49]} material={lighter}>
      <boxGeometry args={[w, h, 0.02]} />
    </mesh>
    <mesh position={[w * 0.49, h * 0.5, 0]} material={GLASS}>
      <boxGeometry args={[0.015, h * 0.95, d * 0.98]} />
    </mesh>
    <mesh position={[w * 0.15, h * 0.5, d * 0.49]} material={GLASS}>
      <boxGeometry args={[w * 0.65, h * 0.95, 0.015]} />
    </mesh>
    <mesh position={[w * 0.49, h * 0.975, 0]} material={CHROME}>
      <boxGeometry args={[0.01, 0.01, d]} />
    </mesh>
    <mesh position={[w * 0.15, h * 0.975, d * 0.49]} material={CHROME}>
      <boxGeometry args={[w * 0.65, 0.01, 0.01]} />
    </mesh>
    <Cylinder
      args={[0.012, 0.012, h * 0.8, 8]}
      position={[-w * 0.35, h * 0.5, -d * 0.4]}
      castShadow
      material={CHROME}
    />
    <Cylinder
      args={[0.04, 0.015, 0.025, 12]}
      position={[-w * 0.35, h * 0.92, -d * 0.4]}
      castShadow
      material={CHROME}
    />
    <Cylinder
      args={[0.008, 0.008, 0.08, 8]}
      rotation={[Math.PI / 2, 0, 0]}
      position={[-w * 0.35, h * 0.9, -d * 0.36]}
      material={CHROME}
    />
  </>
);
