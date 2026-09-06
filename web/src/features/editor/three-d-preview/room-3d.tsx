"use client";

import { useMemo, useEffect } from "react";
import { Shape, ShapeGeometry, MeshStandardMaterial, DoubleSide } from "three";
import { Text } from "@react-three/drei";
import { ROOM_USAGE_COLORS, centroid, polygonArea } from "@/lib/canvas";
import { formatArea } from "@/lib/constants";
import type { Room } from "@/types";

const SCALE = 0.001;
const FLOOR_ELEVATION = 0.02;

interface Room3DProps {
  room: Room;
  offsetX: number;
  offsetZ: number;
  showColor: boolean;
}

export const Room3D = ({ room, offsetX, offsetZ, showColor }: Room3DProps) => {
  const geometry = useMemo(() => {
    if (room.polygon.length < 3) return null;
    const shape = new Shape();
    room.polygon.forEach(([x, y], i) => {
      const px = x * SCALE - offsetX;
      const pz = -(y * SCALE - offsetZ);
      if (i === 0) shape.moveTo(px, pz);
      else shape.lineTo(px, pz);
    });
    shape.closePath();
    return new ShapeGeometry(shape);
  }, [room.polygon, offsetX, offsetZ]);

  const roomColor = ROOM_USAGE_COLORS[room.usage] ?? ROOM_USAGE_COLORS.generic;

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: showColor ? roomColor : "#d4d4d8",
        roughness: 0.9,
        metalness: 0,
        transparent: true,
        opacity: showColor ? 0.35 : 0.12,
        depthWrite: false,
        side: DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    [roomColor, showColor],
  );

  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  const [cx, cy] = centroid(room.polygon);
  const center = { x: cx * SCALE - offsetX, z: cy * SCALE - offsetZ };
  const area = polygonArea(room.polygon);

  if (!geometry) return null;

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_ELEVATION, 0]}
        receiveShadow
      />
      <Text
        position={[center.x, 0.3, center.z]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.2}
        color="#52525b"
        anchorX="center"
        anchorY="middle"
        maxWidth={3}
        fontWeight={700}
      >
        {room.name}
      </Text>
      {area > 0 && (
        <Text
          position={[center.x, 0.15, center.z + 0.15]}
          rotation={[-Math.PI / 4, 0, 0]}
          fontSize={0.12}
          color="#6b6b78"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
        >
          {formatArea(area)}
        </Text>
      )}
    </group>
  );
};
