"use client";

import { useMemo } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import type { PlacedFurniture } from "@/types";

const SCALE = 0.01;

interface Furniture3DProps {
  placed: PlacedFurniture;
  offsetX: number;
  offsetZ: number;
  furnitureColor?: string;
}

export const Furniture3D = ({ placed, offsetX, offsetZ, furnitureColor }: Furniture3DProps) => {
  const item = placed.furnitureItem;

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: furnitureColor || item.color || "#a1a1aa",
        roughness: 0.6,
        metalness: 0.1,
      }),
    [item.color, furnitureColor],
  );

  const dimensions = useMemo(() => {
    const w = item.width * SCALE * (placed.scaleX || 1);
    const h = (item.depth || item.height * 0.5) * SCALE;
    const d = item.height * SCALE * (placed.scaleY || 1);

    return { w, h, d };
  }, [item.width, item.height, item.depth, placed.scaleX, placed.scaleY]);

  const position = useMemo(() => {
    const x = placed.x * SCALE - offsetX;
    const y = dimensions.h / 2;
    const z = placed.y * SCALE - offsetZ;

    return [x, y, z] as [number, number, number];
  }, [placed.x, placed.y, offsetX, offsetZ, dimensions.h]);

  const rotation = useMemo(() => {
    const rad = ((placed.rotation || 0) * Math.PI) / 180;
    return [0, -rad, 0] as [number, number, number];
  }, [placed.rotation]);

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox
        args={[dimensions.w, dimensions.h, dimensions.d]}
        radius={0.02}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <primitive object={material} attach="material" />
      </RoundedBox>
      <Text
        position={[0, dimensions.h / 2 + 0.15, 0]}
        fontSize={0.12}
        color="#52525b"
        anchorX="center"
        anchorY="bottom"
        maxWidth={2}
      >
        {item.name}
      </Text>
    </group>
  );
};
