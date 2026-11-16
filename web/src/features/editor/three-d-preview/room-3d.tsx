"use client";

import { useMemo, useEffect } from "react";
import { Shape, ShapeGeometry, MeshStandardMaterial, DoubleSide } from "three";
import { Text } from "@react-three/drei";
import { ROOM_USAGE_COLORS, centroid } from "@/lib/canvas";
import { polygonArea, type Room } from "@/shared/canvas";
import { formatArea, M_PER_MM } from "@/lib/constants";
import {
  ROOM_AREA_TEXT_3D,
  ROOM_FLOOR_NEUTRAL_3D,
  ROOM_NAME_TEXT_3D,
} from "@/features/editor/canvas/palette";

const FLOOR_ELEVATION_M = 0.02;

type Room3DProps = {
  room: Room;
  offsetX: number;
  offsetZ: number;
  showColor: boolean;
};

export const Room3D = ({ room, offsetX, offsetZ, showColor }: Room3DProps) => {
  const geometry = useMemo(() => {
    if (room.polygon.length < 3) return null;
    const shape = new Shape();
    room.polygon.forEach(([x, y], i) => {
      const px = x * M_PER_MM - offsetX;
      const pz = -(y * M_PER_MM - offsetZ);
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
        color: showColor ? roomColor : ROOM_FLOOR_NEUTRAL_3D,
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
  const center = { x: cx * M_PER_MM - offsetX, z: cy * M_PER_MM - offsetZ };
  const area = polygonArea(room.polygon);

  if (!geometry) return null;

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, FLOOR_ELEVATION_M, 0]}
        receiveShadow
      />
      <Text
        position={[center.x, 0.3, center.z]}
        rotation={[-Math.PI / 4, 0, 0]}
        fontSize={0.2}
        color={ROOM_NAME_TEXT_3D}
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
          color={ROOM_AREA_TEXT_3D}
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
