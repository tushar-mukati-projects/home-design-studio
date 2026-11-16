"use client";

import { useMemo, useEffect, type ComponentRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import { useEditorStore } from "@/stores/editor-store";
import { boundsOf } from "@/lib/canvas";
import { M_PER_MM } from "@/lib/constants";
import {
  AMBIENT_LIGHT,
  FILL_LIGHT,
  HEMISPHERE_GROUND,
  HEMISPHERE_SKY,
  SCENE_BACKGROUND,
  SCENE_GRADIENT,
  SCENE_GRID,
  SCENE_GRID_CENTER,
  SUN_LIGHT,
} from "@/features/editor/canvas/palette";
import { Wall3D } from "./wall-3d";
import { Furniture3D } from "./furniture-3d";
import { Room3D } from "./room-3d";
import { SceneErrorBoundary } from "./scene-error-boundary";
import { CAMERA_PRESETS, type CameraPreset, type CameraPresetId } from "./camera-presets";

const MIN_SCENE_SIZE_M = 5;

type Bounds = NonNullable<ReturnType<typeof boundsOf>>;

type SceneFrame = { cx: number; cz: number; size: number };

type PreviewSceneProps = {
  cameraPreset: CameraPresetId;
  showFurniture: boolean;
  showRoomColors: boolean;
  ambientIntensity: number;
  floorColor: string;
  wallColor: string;
  furnitureColor: string;
};

type PreviewCanvasProps = PreviewSceneProps & { frame: SceneFrame };
type SceneContentsProps = Omit<PreviewCanvasProps, "cameraPreset">;
type SceneLightsProps = { size: number; ambientIntensity: number };
type CameraRigProps = { preset: CameraPreset };
type OrbitControlsImpl = ComponentRef<typeof OrbitControls>;

export const PreviewScene = (props: PreviewSceneProps) => {
  const walls = useEditorStore((s) => s.walls);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);
  const bounds = useMemo(() => boundsOf({ walls, rooms, furniture }), [walls, rooms, furniture]);

  if (!bounds) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background p-4">
        <p className="text-center text-sm text-muted-foreground">
          Nothing to preview yet. Draw some walls first.
        </p>
      </div>
    );
  }

  return (
    <SceneErrorBoundary>
      <PreviewCanvas {...props} frame={sceneFrame(bounds)} />
    </SceneErrorBoundary>
  );
};

const sceneFrame = (bounds: Bounds): SceneFrame => {
  const minX = bounds.minX * M_PER_MM;
  const maxX = bounds.maxX * M_PER_MM;
  const minY = bounds.minY * M_PER_MM;
  const maxY = bounds.maxY * M_PER_MM;
  return {
    cx: (minX + maxX) / 2,
    cz: (minY + maxY) / 2,
    size: Math.max(maxX - minX, maxY - minY, MIN_SCENE_SIZE_M),
  };
};

const PreviewCanvas = ({ cameraPreset, frame, ...contents }: PreviewCanvasProps) => {
  const preset = useMemo(
    () => CAMERA_PRESETS[cameraPreset](frame.size),
    [cameraPreset, frame.size],
  );

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
      style={{ background: SCENE_GRADIENT }}
      onCreated={({ camera, invalidate }) => {
        camera.position.set(...preset.position);
        camera.lookAt(...preset.target);
        invalidate();
      }}
    >
      <CameraRig preset={preset} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={0.5}
        maxDistance={frame.size * 5}
        maxPolarAngle={Math.PI * 0.48}
      />
      <SceneContents frame={frame} {...contents} />
    </Canvas>
  );
};

const CameraRig = ({ preset }: CameraRigProps) => {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as OrbitControlsImpl | null;
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    camera.position.set(...preset.position);
    if (controls) {
      controls.target.set(...preset.target);
      controls.update();
    } else {
      camera.lookAt(...preset.target);
    }
    invalidate();
  }, [preset, camera, controls, invalidate]);
  return null;
};

const SceneContents = ({
  frame,
  showFurniture,
  showRoomColors,
  ambientIntensity,
  floorColor,
  wallColor,
  furnitureColor,
}: SceneContentsProps) => {
  const walls = useEditorStore((s) => s.walls);
  const openings = useEditorStore((s) => s.openings);
  const furniture = useEditorStore((s) => s.furniture);
  const rooms = useEditorStore((s) => s.rooms);

  const openingsByWall = useMemo(() => {
    const map = new Map<string, typeof openings>();
    for (const o of openings) map.set(o.wall, [...(map.get(o.wall) ?? []), o]);
    return map;
  }, [openings]);

  const floorMat = useMemo(
    () => new MeshStandardMaterial({ color: floorColor, roughness: 0.8, metalness: 0.05 }),
    [floorColor],
  );
  useEffect(() => () => floorMat.dispose(), [floorMat]);

  return (
    <>
      <color attach="background" args={[SCENE_BACKGROUND]} />
      <SceneLights size={frame.size} ambientIntensity={ambientIntensity} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
        <planeGeometry args={[frame.size * 3, frame.size * 3]} />
        <primitive object={floorMat} attach="material" />
      </mesh>

      <gridHelper
        args={[frame.size * 3, Math.round(frame.size * 3), SCENE_GRID_CENTER, SCENE_GRID]}
        position={[0, 0.001, 0]}
      />

      {rooms.map((room) => (
        <Room3D
          key={room.id}
          room={room}
          offsetX={frame.cx}
          offsetZ={frame.cz}
          showColor={showRoomColors}
        />
      ))}

      {walls.map((wall) => (
        <Wall3D
          key={wall.id}
          wall={wall}
          openings={openingsByWall.get(wall.id) ?? []}
          offsetX={frame.cx}
          offsetZ={frame.cz}
          wallColor={wallColor}
        />
      ))}

      {showFurniture &&
        furniture.map((f) => (
          <Furniture3D
            key={f.id}
            placed={f}
            offsetX={frame.cx}
            offsetZ={frame.cz}
            furnitureColor={furnitureColor}
          />
        ))}

      <Environment preset="apartment" />
    </>
  );
};

const SceneLights = ({ size, ambientIntensity }: SceneLightsProps) => {
  const shadowCamSize = Math.max(size * 1.2, 6);
  return (
    <>
      <ambientLight intensity={ambientIntensity * 0.5} color={AMBIENT_LIGHT} />
      <directionalLight
        position={[size * 0.7, size * 1.2, size * 0.5]}
        intensity={1.8}
        color={SUN_LIGHT}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-shadowCamSize}
        shadow-camera-right={shadowCamSize}
        shadow-camera-top={shadowCamSize}
        shadow-camera-bottom={-shadowCamSize}
        shadow-camera-near={0.1}
        shadow-camera-far={size * 4}
        shadow-bias={-0.002}
      />
      <directionalLight
        position={[-size * 0.5, size * 0.6, -size * 0.3]}
        intensity={0.3}
        color={FILL_LIGHT}
      />
      <hemisphereLight args={[HEMISPHERE_SKY, HEMISPHERE_GROUND, 0.4]} />
    </>
  );
};
