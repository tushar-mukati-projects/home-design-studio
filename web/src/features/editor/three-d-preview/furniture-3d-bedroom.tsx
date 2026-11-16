"use client";

import { RoundedBox, Cylinder, Sphere } from "@react-three/drei";
import { CHROME, CornerLegs, type ModelProps, type PieceProps } from "./furniture-3d-parts";

export const BEDROOM_ITEMS = ["double-bed", "single-bed", "nightstand", "wardrobe", "dresser"];

const DRESSER_SEAM_FRACTIONS = [0.3, 0.5, 0.7];
const DRESSER_HANDLE_FRACTIONS = [0.4, 0.6, 0.8];

export const BedroomModel = ({ item, ...piece }: ModelProps) => {
  switch (item) {
    case "double-bed":
      return <DoubleBed {...piece} />;
    case "single-bed":
      return <SingleBed {...piece} />;
    case "nightstand":
      return <Nightstand {...piece} />;
    case "wardrobe":
      return <Wardrobe {...piece} />;
    case "dresser":
      return <Dresser {...piece} />;
    default:
      return null;
  }
};

const DoubleBed = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => {
  const frameH = h * 0.18;
  const mattH = h * 0.25;
  const pillowH = h * 0.1;

  return (
    <>
      <RoundedBox
        args={[w, frameH, d]}
        radius={0.02}
        smoothness={3}
        position={[0, frameH / 2, 0]}
        castShadow
        receiveShadow
        material={darker}
      />
      <RoundedBox
        args={[w * 0.96, mattH, d * 0.92]}
        radius={0.04}
        smoothness={4}
        position={[0, frameH + mattH / 2, 0]}
        castShadow
        receiveShadow
        material={lighter}
      />
      <RoundedBox
        args={[w, h * 0.55, d * 0.05]}
        radius={0.025}
        smoothness={3}
        position={[0, h * 0.275, -d * 0.475]}
        castShadow
        receiveShadow
        material={base}
      />
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[w * 0.28, pillowH, d * 0.18]}
          radius={0.04}
          smoothness={4}
          position={[side * w * 0.2, frameH + mattH + pillowH / 2, -d * 0.3]}
          castShadow
          material={lighter}
        />
      ))}
      <RoundedBox
        args={[w * 0.92, h * 0.08, d * 0.5]}
        radius={0.03}
        smoothness={3}
        position={[0, frameH + mattH + h * 0.04, d * 0.15]}
        castShadow
        material={base}
      />
    </>
  );
};

const SingleBed = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => {
  const frameH = h * 0.18;
  const mattH = h * 0.25;

  return (
    <>
      <RoundedBox
        args={[w, frameH, d]}
        radius={0.02}
        smoothness={3}
        position={[0, frameH / 2, 0]}
        castShadow
        receiveShadow
        material={darker}
      />
      <RoundedBox
        args={[w * 0.96, mattH, d * 0.92]}
        radius={0.04}
        smoothness={4}
        position={[0, frameH + mattH / 2, 0]}
        castShadow
        receiveShadow
        material={lighter}
      />
      <RoundedBox
        args={[w, h * 0.55, d * 0.05]}
        radius={0.025}
        smoothness={3}
        position={[0, h * 0.275, -d * 0.475]}
        castShadow
        receiveShadow
        material={base}
      />
      <RoundedBox
        args={[w * 0.3, h * 0.1, d * 0.18]}
        radius={0.04}
        smoothness={4}
        position={[0, frameH + mattH + h * 0.05, -d * 0.3]}
        castShadow
        material={lighter}
      />
      <RoundedBox
        args={[w * 0.92, h * 0.08, d * 0.45]}
        radius={0.03}
        smoothness={3}
        position={[0, frameH + mattH + h * 0.04, d * 0.15]}
        castShadow
        material={base}
      />
    </>
  );
};

const Nightstand = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.85, d]}
      radius={0.02}
      smoothness={4}
      position={[0, h * 0.5, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <CornerLegs
      w={w}
      d={d}
      legH={h * 0.1}
      radius={0.012}
      material={darker}
      insetX={0.05}
      insetZ={0.05}
    />
    <mesh position={[0, h * 0.5, d * 0.505]} material={darker}>
      <boxGeometry args={[w * 0.85, 0.004, 0.004]} />
    </mesh>
    <Sphere args={[0.015, 8, 8]} position={[0, h * 0.62, d * 0.52]} material={CHROME} />
  </>
);

const Wardrobe = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={base}>
      <boxGeometry args={[w, h, d]} />
    </mesh>
    <mesh position={[0, h / 2, d * 0.505]} material={darker}>
      <boxGeometry args={[0.005, h * 0.92, 0.005]} />
    </mesh>
    {[-1, 1].map((side) => (
      <mesh key={side} position={[side * w * 0.25, h / 2, d * 0.502]} material={darker}>
        <boxGeometry args={[w * 0.45, h * 0.9, 0.006]} />
      </mesh>
    ))}
    {[-1, 1].map((side) => (
      <Cylinder
        key={side}
        args={[0.008, 0.008, h * 0.08, 8]}
        position={[side * w * 0.04, h * 0.52, d * 0.53]}
        material={CHROME}
      />
    ))}
  </>
);

const Dresser = ({ w, h, d, materials: { base, darker } }: PieceProps) => (
  <>
    <RoundedBox
      args={[w, h * 0.85, d]}
      radius={0.02}
      smoothness={4}
      position={[0, h * 0.5, 0]}
      castShadow
      receiveShadow
      material={base}
    />
    <CornerLegs
      w={w}
      d={d}
      legH={h * 0.1}
      radius={0.012}
      material={darker}
      insetX={0.05}
      insetZ={0.05}
    />
    {DRESSER_SEAM_FRACTIONS.map((frac) => (
      <mesh key={frac} position={[0, h * frac, d * 0.505]} material={darker}>
        <boxGeometry args={[w * 0.9, 0.005, 0.005]} />
      </mesh>
    ))}
    {DRESSER_HANDLE_FRACTIONS.map((frac) => (
      <Cylinder
        key={frac}
        args={[0.006, 0.006, w * 0.08, 8]}
        rotation={[0, 0, Math.PI / 2]}
        position={[0, h * frac, d * 0.52]}
        material={CHROME}
      />
    ))}
  </>
);
