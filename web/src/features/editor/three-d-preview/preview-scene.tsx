"use client";

import { useMemo, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
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

const InvalidateOnChange = (props: Record<string, unknown>) => {
  const { invalidate } = useThree();
  useEffect(() => {
    invalidate();
  }, [props.showFurniture, props.showRoomColors, props.ambientIntensity, props.floorColor, props.wallColor, props.furnitureColor, invalidate]);
  return null;
};

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

  const shadowCamSize = Math.max(bounds.size * 1.2, 6);

  return (
    <>
      <InvalidateOnChange
        showFurniture={showFurniture}
        showRoomColors={showRoomColors}
        ambientIntensity={ambientIntensity}
        floorColor={floorColor}
        wallColor={wallColor}
        furnitureColor={furnitureColor}
      />

      <color attach="background" args={["#c8ccd4"]} />

      <ambientLight intensity={ambientIntensity * 0.5} color="#e8ecf0" />
      <directionalLight
        position={[bounds.size * 0.7, bounds.size * 1.2, bounds.size * 0.5]}
        intensity={1.8}
        color="#fff8f0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-shadowCamSize}
        shadow-camera-right={shadowCamSize}
        shadow-camera-top={shadowCamSize}
        shadow-camera-bottom={-shadowCamSize}
        shadow-camera-near={0.1}
        shadow-camera-far={bounds.size * 4}
        shadow-bias={-0.002}
      />
      <directionalLight
        position={[-bounds.size * 0.5, bounds.size * 0.6, -bounds.size * 0.3]}
        intensity={0.3}
        color="#b8c0d0"
      />
      <hemisphereLight args={["#d0d4dc", "#808890", 0.4]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[bounds.size * 3, bounds.size * 3]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      <gridHelper
        args={[bounds.size * 3, Math.round(bounds.size * 3), "#9098a0", "#a8b0b8"]}
        position={[0, 0.001, 0]}
      />

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

      {!hasContent && (
        <mesh position={[0, 1.5, 0]}>
          <planeGeometry args={[4, 0.5]} />
          <meshBasicMaterial color="#71717a" transparent opacity={0} />
        </mesh>
      )}

      <Environment preset="apartment" />
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
      frameloop="demand"
      shadows
      camera={{
        position: preset.position,
        fov: 55,
        near: 0.1,
        far: 500,
      }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      style={{ background: "linear-gradient(180deg, #b8bcc8 0%, #a0a4b0 50%, #909498 100%)" }}
      onCreated={({ camera, invalidate }) => {
        camera.position.set(...preset.position);
        camera.lookAt(...preset.target);
        invalidate();
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
