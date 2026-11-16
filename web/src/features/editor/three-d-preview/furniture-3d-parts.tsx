"use client";

import { Cylinder } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import { BOOK_COLORS_3D, CHROME_3D, GLASS_3D } from "@/features/editor/canvas/palette";

export type Materials = {
  base: MeshStandardMaterial;
  darker: MeshStandardMaterial;
  lighter: MeshStandardMaterial;
};

export type ModelProps = {
  item: string;
  w: number;
  h: number;
  d: number;
  materials: Materials;
};

export type PieceProps = Omit<ModelProps, "item">;

type CornerLegsProps = {
  w: number;
  d: number;
  legH: number;
  radius: number;
  material: MeshStandardMaterial;
  insetX?: number;
  insetZ?: number;
};

export const CHROME = new MeshStandardMaterial({
  color: CHROME_3D,
  roughness: 0.1,
  metalness: 0.85,
});

export const GLASS = new MeshStandardMaterial({
  color: GLASS_3D,
  transparent: true,
  opacity: 0.2,
  roughness: 0.02,
  metalness: 0.05,
});

export const BOOK_MATS = BOOK_COLORS_3D.map(
  (color) => new MeshStandardMaterial({ color, roughness: 0.7 }),
);

export const CornerLegs = ({
  w,
  d,
  legH,
  radius,
  material,
  insetX = 0.1,
  insetZ = 0.1,
}: CornerLegsProps) => {
  const positions: [number, number, number][] = [
    [-w * (0.5 - insetX), legH / 2, -d * (0.5 - insetZ)],
    [w * (0.5 - insetX), legH / 2, -d * (0.5 - insetZ)],
    [-w * (0.5 - insetX), legH / 2, d * (0.5 - insetZ)],
    [w * (0.5 - insetX), legH / 2, d * (0.5 - insetZ)],
  ];
  return (
    <>
      {positions.map((pos, i) => (
        <Cylinder
          key={i}
          args={[radius, radius, legH, 8]}
          position={pos}
          castShadow
          material={material}
        />
      ))}
    </>
  );
};
