"use client";

import { useMemo, useEffect } from "react";
import { MeshStandardMaterial } from "three";
import { wallAngle } from "@/lib/canvas";
import { wallLength, type Opening, type Wall } from "@/shared/canvas";
import { M_PER_MM } from "@/lib/constants";
import { DOOR_FRAME_3D, WINDOW_GLASS_3D } from "@/features/editor/canvas/palette";

const doorFrameMaterial = new MeshStandardMaterial({
  color: DOOR_FRAME_3D,
  roughness: 0.5,
  metalness: 0.15,
});

const windowMaterial = new MeshStandardMaterial({
  color: WINDOW_GLASS_3D,
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.35,
});

type Wall3DProps = {
  wall: Wall;
  openings: Opening[];
  offsetX: number;
  offsetZ: number;
  wallColor: string;
};

type Segment = {
  centre: number;
  length: number;
  yOffset: number;
  height: number;
  glass?: boolean;
};

export const Wall3D = ({ wall, openings, offsetX, offsetZ, wallColor }: Wall3DProps) => {
  const wallMaterial = useMemo(
    () => new MeshStandardMaterial({ color: wallColor, roughness: 0.8, metalness: 0.02 }),
    [wallColor],
  );
  useEffect(() => () => wallMaterial.dispose(), [wallMaterial]);

  const geometry = useMemo(
    () => ({
      length: wallLength(wall) * M_PER_MM,
      angle: wallAngle(wall),
      thickness: wall.thickness * M_PER_MM,
      centerX: ((wall.from[0] + wall.to[0]) / 2) * M_PER_MM - offsetX,
      centerZ: ((wall.from[1] + wall.to[1]) / 2) * M_PER_MM - offsetZ,
    }),
    [wall, offsetX, offsetZ],
  );

  const segments = useMemo(() => segmentsFor(wall, openings), [wall, openings]);
  const doors = openings.filter((o) => o.kind === "door");

  return (
    <group position={[geometry.centerX, 0, geometry.centerZ]} rotation={[0, -geometry.angle, 0]}>
      {segments.map((seg, idx) => (
        <mesh
          key={idx}
          position={[seg.centre - geometry.length / 2, seg.yOffset, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry
            args={[seg.length, seg.height, geometry.thickness * (seg.glass ? 0.5 : 1)]}
          />
          <primitive object={seg.glass ? windowMaterial : wallMaterial} attach="material" />
        </mesh>
      ))}

      {doors.map((door) => {
        const localX = door.offset * M_PER_MM - geometry.length / 2;
        const width = door.width * M_PER_MM;
        const height = door.height * M_PER_MM;
        const panelThickness = geometry.thickness * 0.15;
        const hingeRight = door.hinge === "right";
        const swingOut = door.swing === "out";
        const swingZ = swingOut ? -geometry.thickness / 2 : geometry.thickness / 2;
        const sign = swingOut ? -1 : 1;

        if (door.variant === "double") {
          const half = width / 2;
          return (
            <group key={door.id}>
              <group position={[localX - half, 0, swingZ]} rotation={[0, sign * Math.PI * 0.2, 0]}>
                <mesh position={[half * 0.475, height / 2, 0]} castShadow>
                  <boxGeometry args={[half * 0.95, height, panelThickness]} />
                  <primitive object={doorFrameMaterial} attach="material" />
                </mesh>
              </group>
              <group position={[localX + half, 0, swingZ]} rotation={[0, -sign * Math.PI * 0.2, 0]}>
                <mesh position={[-half * 0.475, height / 2, 0]} castShadow>
                  <boxGeometry args={[half * 0.95, height, panelThickness]} />
                  <primitive object={doorFrameMaterial} attach="material" />
                </mesh>
              </group>
            </group>
          );
        }

        if (door.variant === "sliding") {
          return (
            <mesh
              key={door.id}
              position={[localX + width * 0.3, height / 2, geometry.thickness / 2]}
              castShadow
            >
              <boxGeometry args={[width * 0.95, height, panelThickness]} />
              <primitive object={doorFrameMaterial} attach="material" />
            </mesh>
          );
        }

        const hingeX = hingeRight ? localX + width / 2 : localX - width / 2;
        const meshOffsetX = hingeRight ? -width / 2 : width / 2;
        const hingeAngle = hingeRight ? -sign * Math.PI * 0.25 : sign * Math.PI * 0.25;
        return (
          <group key={door.id} position={[hingeX, 0, swingZ]} rotation={[0, hingeAngle, 0]}>
            <mesh position={[meshOffsetX, height / 2, 0]} castShadow>
              <boxGeometry args={[width * 0.95, height, panelThickness]} />
              <primitive object={doorFrameMaterial} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

const segmentsFor = (wall: Wall, openings: Opening[]): Segment[] => {
  const total = wallLength(wall) * M_PER_MM;
  const H = wall.height * M_PER_MM;
  const sorted = [...openings]
    .map((o) => ({
      start: (o.offset - o.width / 2) * M_PER_MM,
      end: (o.offset + o.width / 2) * M_PER_MM,
      height: o.height * M_PER_MM,
      sill: (o.sill ?? 0) * M_PER_MM,
      kind: o.kind,
    }))
    .sort((a, b) => a.start - b.start);

  if (sorted.length === 0) return [{ centre: total / 2, length: total, yOffset: H / 2, height: H }];

  const out: Segment[] = [];
  let cursor = 0;

  for (const o of sorted) {
    const start = Math.max(0, o.start);
    const end = Math.min(total, o.end);
    if (start > cursor) {
      out.push({ centre: (cursor + start) / 2, length: start - cursor, yOffset: H / 2, height: H });
    }
    const centre = (start + end) / 2;
    const length = end - start;
    const top = o.sill + o.height;
    if (o.kind === "window") {
      out.push({ centre, length, yOffset: o.sill / 2, height: o.sill });
      out.push({ centre, length, yOffset: o.sill + o.height / 2, height: o.height, glass: true });
    }
    if (top < H) out.push({ centre, length, yOffset: top + (H - top) / 2, height: H - top });
    cursor = Math.max(cursor, end);
  }

  if (cursor < total) {
    out.push({ centre: (cursor + total) / 2, length: total - cursor, yOffset: H / 2, height: H });
  }
  return out;
};
