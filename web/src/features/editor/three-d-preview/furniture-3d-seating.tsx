"use client";

import { RoundedBox } from "@react-three/drei";
import { CornerLegs, type PieceProps } from "./furniture-3d-parts";

const SOFA_CUSHIONS = 3;

export const Sofa = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => {
  const legH = h * 0.07;
  const armW = w * 0.09;
  const innerW = w - armW * 2;
  const gap = w * 0.008;
  const cW = (innerW - gap * (SOFA_CUSHIONS - 1)) / SOFA_CUSHIONS;
  const seatBase = legH + h * 0.08;
  const seatH = h * 0.2;
  const cushionX = (i: number) => -innerW / 2 + cW / 2 + i * (cW + gap);

  return (
    <>
      <CornerLegs w={w * 0.86} d={d * 0.65} legH={legH} radius={0.015} material={darker} />
      <RoundedBox
        args={[w, h * 0.08, d * 0.78]}
        radius={0.012}
        smoothness={3}
        position={[0, legH + h * 0.04, d * 0.04]}
        castShadow
        receiveShadow
        material={darker}
      />
      {Array.from({ length: SOFA_CUSHIONS }, (_, i) => (
        <RoundedBox
          key={`s${i}`}
          args={[cW * 0.96, seatH, d * 0.56]}
          radius={0.04}
          smoothness={4}
          position={[cushionX(i), seatBase + seatH / 2, d * 0.08]}
          castShadow
          receiveShadow
          material={base}
        />
      ))}
      <RoundedBox
        args={[w * 0.96, h * 0.56, d * 0.08]}
        radius={0.015}
        smoothness={3}
        position={[0, legH + h * 0.36, -d * 0.37]}
        castShadow
        receiveShadow
        material={darker}
      />
      {Array.from({ length: SOFA_CUSHIONS }, (_, i) => (
        <RoundedBox
          key={`b${i}`}
          args={[cW * 0.94, h * 0.32, d * 0.13]}
          radius={0.035}
          smoothness={4}
          position={[cushionX(i), seatBase + seatH + h * 0.16, -d * 0.25]}
          castShadow
          receiveShadow
          material={lighter}
        />
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[armW, h * 0.28, d * 0.66]}
          radius={0.035}
          smoothness={4}
          position={[side * (w / 2 - armW / 2), seatBase + h * 0.14, d * 0.02]}
          castShadow
          receiveShadow
          material={base}
        />
      ))}
    </>
  );
};

export const Armchair = ({ w, h, d, materials: { base, darker, lighter } }: PieceProps) => {
  const legH = h * 0.07;
  const armW = w * 0.15;
  const seatBase = legH + h * 0.08;
  const seatH = h * 0.22;

  return (
    <>
      <CornerLegs w={w * 0.76} d={d * 0.68} legH={legH} radius={0.015} material={darker} />
      <RoundedBox
        args={[w, h * 0.08, d * 0.76]}
        radius={0.012}
        smoothness={3}
        position={[0, legH + h * 0.04, d * 0.04]}
        castShadow
        receiveShadow
        material={darker}
      />
      <RoundedBox
        args={[w * 0.68, seatH, d * 0.56]}
        radius={0.055}
        smoothness={4}
        position={[0, seatBase + seatH / 2, d * 0.06]}
        castShadow
        receiveShadow
        material={base}
      />
      <RoundedBox
        args={[w * 0.9, h * 0.58, d * 0.08]}
        radius={0.02}
        smoothness={3}
        position={[0, legH + h * 0.37, -d * 0.37]}
        castShadow
        receiveShadow
        material={darker}
      />
      <RoundedBox
        args={[w * 0.62, h * 0.36, d * 0.14]}
        radius={0.05}
        smoothness={4}
        position={[0, seatBase + seatH + h * 0.18, -d * 0.24]}
        castShadow
        receiveShadow
        material={lighter}
      />
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[armW, h * 0.28, d * 0.62]}
          radius={0.04}
          smoothness={4}
          position={[side * (w / 2 - armW / 2 - w * 0.02), seatBase + h * 0.14, d * 0.02]}
          castShadow
          receiveShadow
          material={base}
        />
      ))}
    </>
  );
};
