"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Text } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useEditorStore } from "@/stores/editor-store";
import { Wall3D } from "./wall-3d";
import { Furniture3D } from "./furniture-3d";
import { Room3D } from "./room-3d";

const SCALE = 0.01;

interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

interface PreviewSceneProps {
  cameraPreset: string;
  showFurniture: boolean;
  showRoomColors: boolean;
  ambientIntensity: number;
  floorColor: string;
  wallColor: string;
  furnitureColor: string;
}

const SceneContents = ({
  showFurniture,
  showRoomColors,
  ambientIntensity,
  floorColor,
  wallColor,
  furnitureColor,
}: Omit<PreviewSceneProps, "cameraPreset">) => {
  const walls = useEditorStore((s) => s.walls);
  const doors = useEditorStore((s) => s.doors);
  const windows = useEditorStore((s) => s.windows);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);

  const bounds = useMemo(() => {
    const allX: number[] = [];
    const allY: number[] = [];

    for (const w of walls) {
      allX.push(w.x1, w.x2);
      allY.push(w.y1, w.y2);
    }

    for (const f of furniture) {
      allX.push(f.x);
      allY.push(f.y);
    }

    for (const r of rooms) {
      for (const p of r.points) {
        allX.push(p.x);
        allY.push(p.y);
      }
    }

    if (allX.length === 0) {
      return { minX: 0, maxX: 10, minY: 0, maxY: 10, cx: 0, cz: 0, size: 10 };
    }

    const minX = Math.min(...allX) * SCALE;
    const maxX = Math.max(...allX) * SCALE;
    const minY = Math.min(...allY) * SCALE;
    const maxY = Math.max(...allY) * SCALE;
    const cx = (minX + maxX) / 2;
    const cz = (minY + maxY) / 2;
    const size = Math.max(maxX - minX, maxY - minY, 5);

    return { minX, maxX, minY, maxY, cx, cz, size };
  }, [walls, furniture, rooms]);

  const wallDoorMap = useMemo(() => {
    const map = new Map<string, typeof doors>();
    for (const wall of walls) {
      map.set(
        wall.id,
        doors.filter((d) => d.wallId === wall.id),
      );
    }
    return map;
  }, [walls, doors]);

  const wallWindowMap = useMemo(() => {
    const map = new Map<string, typeof windows>();
    for (const wall of walls) {
      map.set(
        wall.id,
        windows.filter((w) => w.wallId === wall.id),
      );
    }
    return map;
  }, [walls, windows]);

  const hasContent = walls.length > 0 || rooms.length > 0 || furniture.length > 0;

  const floorMat = useMemo(
    () =>
      new MeshStandardMaterial({
        color: floorColor,
        roughness: 0.8,
        metalness: 0.05,
      }),
    [floorColor],
  );

  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#FFF5E6" />
      <directionalLight
        position={[bounds.size * 0.7, bounds.size * 1.2, bounds.size * 0.5]}
        intensity={1.2}
        color="#FFF0D4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-bounds.size}
        shadow-camera-right={bounds.size}
        shadow-camera-top={bounds.size}
        shadow-camera-bottom={-bounds.size}
        shadow-camera-near={0.1}
        shadow-camera-far={bounds.size * 4}
        shadow-bias={-0.001}
      />
      <pointLight
        position={[0, 2.5, 0]}
        intensity={0.3}
        color="#D4A853"
        distance={bounds.size * 2}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[bounds.size * 3, bounds.size * 3]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      {rooms.map((room) => (
        <Room3D
          key={room.id}
          room={room}
          offsetX={bounds.cx}
          offsetZ={bounds.cz}
          showColor={showRoomColors}
        />
      ))}

      {walls.map((wall) => (
        <Wall3D
          key={wall.id}
          wall={wall}
          doors={wallDoorMap.get(wall.id) || []}
          windows={wallWindowMap.get(wall.id) || []}
          offsetX={bounds.cx}
          offsetZ={bounds.cz}
          wallColor={wallColor}
        />
      ))}

      {showFurniture &&
        furniture.map((f) => (
          <Furniture3D
            key={f.id}
            placed={f}
            offsetX={bounds.cx}
            offsetZ={bounds.cz}
            furnitureColor={furnitureColor}
          />
        ))}

      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.4}
        scale={bounds.size * 3}
        blur={2}
        far={bounds.size * 2}
        color="#1A1510"
      />

      {!hasContent && (
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="#8A8278"
          anchorX="center"
          anchorY="middle"
          maxWidth={6}
        >
          No elements to preview. Add walls, rooms, or furniture in the editor.
        </Text>
      )}

      <Environment preset="apartment" />
      <fog attach="fog" args={["#0C0C0C", bounds.size * 3, bounds.size * 8]} />
    </>
  );
};

const CAMERA_PRESETS: Record<string, (size: number) => CameraPreset> = {
  corner: (size) => ({
    position: [size * 0.9, size * 0.8, size * 0.9],
    target: [0, 0, 0],
  }),
  top: (size) => ({
    position: [0, size * 2, 0.01],
    target: [0, 0, 0],
  }),
  front: (size) => ({
    position: [0, size * 0.4, size * 1.5],
    target: [0, size * 0.3, 0],
  }),
  walkthrough: (size) => ({
    position: [0, 1.6, size * 0.3],
    target: [0, 1.6, -size * 0.3],
  }),
};

export const PreviewScene = ({
  cameraPreset,
  showFurniture,
  showRoomColors,
  ambientIntensity,
  floorColor,
  wallColor,
  furnitureColor,
}: PreviewSceneProps) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const walls = useEditorStore((s) => s.walls);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);

  const sceneSize = useMemo(() => {
    const allX: number[] = [];
    const allY: number[] = [];

    for (const w of walls) {
      allX.push(w.x1, w.x2);
      allY.push(w.y1, w.y2);
    }
    for (const f of furniture) {
      allX.push(f.x);
      allY.push(f.y);
    }
    for (const r of rooms) {
      for (const p of r.points) {
        allX.push(p.x);
        allY.push(p.y);
      }
    }

    if (allX.length === 0) return 5;

    const rangeX = (Math.max(...allX) - Math.min(...allX)) * SCALE;
    const rangeY = (Math.max(...allY) - Math.min(...allY)) * SCALE;
    return Math.max(rangeX, rangeY, 5);
  }, [walls, furniture, rooms]);

  const preset = useMemo(() => {
    const fn = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.corner;
    return fn(sceneSize);
  }, [cameraPreset, sceneSize]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...preset.target);
      controlsRef.current.update();
    }
  }, [preset]);

  return (
    <Canvas
      shadows
      camera={{
        position: preset.position,
        fov: 55,
        near: 0.1,
        far: 500,
      }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "#0C0C0C" }}
      onCreated={({ camera }) => {
        camera.position.set(...preset.position);
        camera.lookAt(...preset.target);
      }}
    >
      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={sceneSize * 5}
        maxPolarAngle={Math.PI * 0.48}
        target={preset.target}
      />
      <SceneContents
        showFurniture={showFurniture}
        showRoomColors={showRoomColors}
        ambientIntensity={ambientIntensity}
        floorColor={floorColor}
        wallColor={wallColor}
        furnitureColor={furnitureColor}
      />
    </Canvas>
  );
};
