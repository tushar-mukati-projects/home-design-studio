"use client";

import { useMemo } from "react";
import { Shape, ExtrudeGeometry, MeshStandardMaterial } from "three";
import { Text } from "@react-three/drei";
import type { Room } from "@/types";

const SCALE = 0.01;
const FLOOR_ELEVATION = 0.005;

interface Room3DProps {
  room: Room;
  offsetX: number;
  offsetZ: number;
  showColor: boolean;
}

export const Room3D = ({ room, offsetX, offsetZ, showColor }: Room3DProps) => {
  const geometry = useMemo(() => {
    if (!room.points || room.points.length < 3) return null;

    const shape = new Shape();
    const first = room.points[0];
    shape.moveTo(first.x * SCALE - offsetX, -(first.y * SCALE - offsetZ));

    for (let i = 1; i < room.points.length; i++) {
      const pt = room.points[i];
      shape.lineTo(pt.x * SCALE - offsetX, -(pt.y * SCALE - offsetZ));
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.01,
      bevelEnabled: false,
    };

    return new ExtrudeGeometry(shape, extrudeSettings);
  }, [room.points, offsetX, offsetZ]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: showColor ? room.color || "#d4d4d8" : "#e4e4e7",
        roughness: 0.85,
        metalness: 0,
        transparent: true,
        opacity: showColor ? 0.5 : 0.2,
      }),
    [room.color, showColor],
  );

  const center = useMemo(() => {
    if (!room.points || room.points.length === 0) return { x: 0, z: 0 };
    const cx = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length;
    const cz = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length;
    return {
      x: cx * SCALE - offsetX,
      z: cz * SCALE - offsetZ,
    };
  }, [room.points, offsetX, offsetZ]);

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
      {room.area > 0 && (
        <Text
          position={[center.x, 0.15, center.z + 0.15]}
          rotation={[-Math.PI / 4, 0, 0]}
          fontSize={0.12}
          color="#6b6b78"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
        >
          {(room.area * SCALE * SCALE).toFixed(1)} m2
        </Text>
      )}
    </group>
  );
};
