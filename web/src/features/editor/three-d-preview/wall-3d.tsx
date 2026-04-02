"use client";

import { useMemo } from "react";
import { MeshStandardMaterial } from "three";
import type { Wall, Door, Window as WindowType } from "@/types";

const WALL_HEIGHT = 2.8;
const SCALE = 0.01;
const DOOR_HEIGHT = 2.1;
const WINDOW_BOTTOM = 0.9;
const WINDOW_HEIGHT = 1.2;

const doorFrameMaterial = new MeshStandardMaterial({
  color: "#8B7355",
  roughness: 0.6,
  metalness: 0.1,
});

const windowMaterial = new MeshStandardMaterial({
  color: "#87CEEB",
  roughness: 0.1,
  metalness: 0.3,
  transparent: true,
  opacity: 0.35,
});

interface Wall3DProps {
  wall: Wall;
  doors: Door[];
  windows: WindowType[];
  offsetX: number;
  offsetZ: number;
  wallColor?: string;
}

interface WallSegment {
  positionAlongWall: number;
  length: number;
  yOffset: number;
  height: number;
  type:
    | "wall"
    | "door-gap"
    | "window-glass"
    | "wall-above-door"
    | "wall-below-window"
    | "wall-above-window";
}

export const Wall3D = ({ wall, doors, windows, offsetX, offsetZ, wallColor }: Wall3DProps) => {
  const wallMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: wallColor || "#F5EDE0",
        roughness: 0.85,
        metalness: 0.02,
      }),
    [wallColor],
  );

  const geometry = useMemo(() => {
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const length = Math.sqrt(dx * dx + dy * dy) * SCALE;
    const angle = Math.atan2(dy, dx);
    const thickness = (wall.thickness || 10) * SCALE;
    const centerX = ((wall.x1 + wall.x2) / 2) * SCALE - offsetX;
    const centerZ = ((wall.y1 + wall.y2) / 2) * SCALE - offsetZ;

    return { length, angle, thickness, centerX, centerZ, dx, dy };
  }, [wall, offsetX, offsetZ]);

  const segments = useMemo(() => {
    const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);

    const openings: { start: number; end: number; type: "door" | "window" }[] = [];

    for (const door of doors) {
      const doorWidth = door.width * SCALE;
      const pos = door.position * wallLength * SCALE;
      const halfW = doorWidth / 2;
      openings.push({
        start: pos - halfW,
        end: pos + halfW,
        type: "door",
      });
    }

    for (const win of windows) {
      const winWidth = win.width * SCALE;
      const pos = win.position * wallLength * SCALE;
      const halfW = winWidth / 2;
      openings.push({
        start: pos - halfW,
        end: pos + halfW,
        type: "window",
      });
    }

    openings.sort((a, b) => a.start - b.start);

    const result: WallSegment[] = [];
    let cursor = 0;
    const totalLength = geometry.length;

    for (const opening of openings) {
      const clampedStart = Math.max(0, opening.start);
      const clampedEnd = Math.min(totalLength, opening.end);

      if (clampedStart <= cursor) {
        cursor = Math.max(cursor, clampedEnd);
        if (opening.type === "door") {
          result.push({
            positionAlongWall: (clampedStart + clampedEnd) / 2,
            length: clampedEnd - clampedStart,
            yOffset: DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2,
            height: WALL_HEIGHT - DOOR_HEIGHT,
            type: "wall-above-door",
          });
        } else {
          result.push({
            positionAlongWall: (clampedStart + clampedEnd) / 2,
            length: clampedEnd - clampedStart,
            yOffset: WINDOW_BOTTOM / 2,
            height: WINDOW_BOTTOM,
            type: "wall-below-window",
          });
          result.push({
            positionAlongWall: (clampedStart + clampedEnd) / 2,
            length: clampedEnd - clampedStart,
            yOffset: WINDOW_BOTTOM + WINDOW_HEIGHT / 2,
            height: WINDOW_HEIGHT,
            type: "window-glass",
          });
          result.push({
            positionAlongWall: (clampedStart + clampedEnd) / 2,
            length: clampedEnd - clampedStart,
            yOffset:
              WINDOW_BOTTOM + WINDOW_HEIGHT + (WALL_HEIGHT - WINDOW_BOTTOM - WINDOW_HEIGHT) / 2,
            height: WALL_HEIGHT - WINDOW_BOTTOM - WINDOW_HEIGHT,
            type: "wall-above-window",
          });
        }
        continue;
      }

      if (clampedStart > cursor) {
        result.push({
          positionAlongWall: (cursor + clampedStart) / 2,
          length: clampedStart - cursor,
          yOffset: WALL_HEIGHT / 2,
          height: WALL_HEIGHT,
          type: "wall",
        });
      }

      if (opening.type === "door") {
        result.push({
          positionAlongWall: (clampedStart + clampedEnd) / 2,
          length: clampedEnd - clampedStart,
          yOffset: DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2,
          height: WALL_HEIGHT - DOOR_HEIGHT,
          type: "wall-above-door",
        });
      } else {
        result.push({
          positionAlongWall: (clampedStart + clampedEnd) / 2,
          length: clampedEnd - clampedStart,
          yOffset: WINDOW_BOTTOM / 2,
          height: WINDOW_BOTTOM,
          type: "wall-below-window",
        });
        result.push({
          positionAlongWall: (clampedStart + clampedEnd) / 2,
          length: clampedEnd - clampedStart,
          yOffset: WINDOW_BOTTOM + WINDOW_HEIGHT / 2,
          height: WINDOW_HEIGHT,
          type: "window-glass",
        });
        result.push({
          positionAlongWall: (clampedStart + clampedEnd) / 2,
          length: clampedEnd - clampedStart,
          yOffset:
            WINDOW_BOTTOM + WINDOW_HEIGHT + (WALL_HEIGHT - WINDOW_BOTTOM - WINDOW_HEIGHT) / 2,
          height: WALL_HEIGHT - WINDOW_BOTTOM - WINDOW_HEIGHT,
          type: "wall-above-window",
        });
      }

      cursor = clampedEnd;
    }

    if (cursor < totalLength) {
      result.push({
        positionAlongWall: (cursor + totalLength) / 2,
        length: totalLength - cursor,
        yOffset: WALL_HEIGHT / 2,
        height: WALL_HEIGHT,
        type: "wall",
      });
    }

    if (openings.length === 0) {
      return [
        {
          positionAlongWall: totalLength / 2,
          length: totalLength,
          yOffset: WALL_HEIGHT / 2,
          height: WALL_HEIGHT,
          type: "wall" as const,
        },
      ];
    }

    return result;
  }, [wall, doors, windows, geometry.length]);

  return (
    <group position={[geometry.centerX, 0, geometry.centerZ]} rotation={[0, -geometry.angle, 0]}>
      {segments.map((segment, idx) => {
        const localX = segment.positionAlongWall - geometry.length / 2;

        if (segment.type === "window-glass") {
          return (
            <mesh key={idx} position={[localX, segment.yOffset, 0]} castShadow receiveShadow>
              <boxGeometry args={[segment.length, segment.height, geometry.thickness * 0.5]} />
              <primitive object={windowMaterial} attach="material" />
            </mesh>
          );
        }

        return (
          <mesh key={idx} position={[localX, segment.yOffset, 0]} castShadow receiveShadow>
            <boxGeometry args={[segment.length, segment.height, geometry.thickness]} />
            <primitive object={wallMaterial} attach="material" />
          </mesh>
        );
      })}
      {doors.map((door) => {
        const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2) * SCALE;
        const doorPos = door.position * wallLength;
        const doorWidth = door.width * SCALE;
        const localX = doorPos - geometry.length / 2;
        const doorThickness = geometry.thickness * 0.15;

        const fh = !!door.flipHinge;
        const fs = !!door.flipSwing;
        const swingZ = fs ? -geometry.thickness / 2 : geometry.thickness / 2;
        const swingSign = fs ? -1 : 1;

        if (door.type === "double") {
          const halfW = doorWidth / 2;
          const leftHingeX = localX - halfW;
          const rightHingeX = localX + halfW;
          return (
            <group key={`door-panel-${door.id}`}>
              <group
                position={[leftHingeX, 0, swingZ]}
                rotation={[0, swingSign * Math.PI * 0.2, 0]}
              >
                <mesh position={[halfW * 0.475, DOOR_HEIGHT / 2, 0]} castShadow>
                  <boxGeometry args={[halfW * 0.95, DOOR_HEIGHT, doorThickness]} />
                  <primitive object={doorFrameMaterial} attach="material" />
                </mesh>
              </group>
              <group
                position={[rightHingeX, 0, swingZ]}
                rotation={[0, -swingSign * Math.PI * 0.2, 0]}
              >
                <mesh position={[-halfW * 0.475, DOOR_HEIGHT / 2, 0]} castShadow>
                  <boxGeometry args={[halfW * 0.95, DOOR_HEIGHT, doorThickness]} />
                  <primitive object={doorFrameMaterial} attach="material" />
                </mesh>
              </group>
            </group>
          );
        }

        if (door.type === "sliding") {
          return (
            <mesh
              key={`door-panel-${door.id}`}
              position={[localX + doorWidth * 0.3, DOOR_HEIGHT / 2, geometry.thickness / 2]}
              castShadow
            >
              <boxGeometry args={[doorWidth * 0.95, DOOR_HEIGHT, doorThickness]} />
              <primitive object={doorFrameMaterial} attach="material" />
            </mesh>
          );
        }

        const hingeX = fh ? localX + doorWidth / 2 : localX - doorWidth / 2;
        const meshOffsetX = fh ? -doorWidth / 2 : doorWidth / 2;
        const hingeAngle = fh ? -swingSign * Math.PI * 0.25 : swingSign * Math.PI * 0.25;
        return (
          <group
            key={`door-panel-${door.id}`}
            position={[hingeX, 0, swingZ]}
            rotation={[0, hingeAngle, 0]}
          >
            <mesh position={[meshOffsetX, DOOR_HEIGHT / 2, 0]} castShadow>
              <boxGeometry args={[doorWidth * 0.95, DOOR_HEIGHT, doorThickness]} />
              <primitive object={doorFrameMaterial} attach="material" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
