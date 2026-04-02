"use client";

import { useMemo } from "react";
import { Shape, ShapeGeometry, MeshStandardMaterial, DoubleSide } from "three";
import { Text } from "@react-three/drei";
import type { Room } from "@/types";

const SCALE = 0.01;
const FLOOR_ELEVATION = 0.02;

const ROOM_3D_COLORS: Record<string, string> = {
  "living-room": "#c8c8ce",
  living_room: "#c8c8ce",
  bedroom: "#c4c0cc",
  kitchen: "#ccc8c4",
  bathroom: "#c0c8d0",
  office: "#c4ccc4",
  dining: "#ccc8c0",
  hallway: "#d0d0d4",
  garage: "#b8b8bc",
  generic: "#c8c8cc",
};

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

    return new ShapeGeometry(shape);
  }, [room.points, offsetX, offsetZ]);

  const roomColor = ROOM_3D_COLORS[room.type] || ROOM_3D_COLORS.generic;

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
