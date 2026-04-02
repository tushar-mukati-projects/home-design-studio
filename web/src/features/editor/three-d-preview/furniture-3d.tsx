"use client";

import { useMemo } from "react";
import { RoundedBox, Cylinder, Sphere } from "@react-three/drei";
import { MeshStandardMaterial, Color } from "three";
import type { PlacedFurniture } from "@/types";

const SCALE = 0.01;

function makeDerived(
  base: MeshStandardMaterial,
  lightnessOffset: number,
  saturationOffset = 0,
): MeshStandardMaterial {
  const c = new Color(base.color.getHex());
  c.offsetHSL(0, saturationOffset, lightnessOffset);
  return new MeshStandardMaterial({
    color: c,
    roughness: base.roughness,
    metalness: base.metalness,
  });
}

interface CornerLegsProps {
  w: number;
  d: number;
  legH: number;
  radius: number;
  material: MeshStandardMaterial;
  insetX?: number;
  insetZ?: number;
}

const CornerLegs = ({
  w,
  d,
  legH,
  radius,
  material,
  insetX = 0.1,
  insetZ = 0.1,
}: CornerLegsProps) => {
  const positions: [number, number, number][] = [
    [-w * (0.5 - insetX), legH / 2, -d * (0.5 - insetZ)],
    [w * (0.5 - insetX), legH / 2, -d * (0.5 - insetZ)],
    [-w * (0.5 - insetX), legH / 2, d * (0.5 - insetZ)],
    [w * (0.5 - insetX), legH / 2, d * (0.5 - insetZ)],
  ];
  return (
    <>
      {positions.map((pos, i) => (
        <Cylinder
          key={i}
          args={[radius, radius, legH, 8]}
          position={pos}
          castShadow
          material={material}
        />
      ))}
    </>
  );
};

interface FurnitureModelProps {
  itemId: string;
  w: number;
  h: number;
  d: number;
  material: MeshStandardMaterial;
}

const FurnitureModel = ({ itemId, w, h, d, material }: FurnitureModelProps) => {
  const darker = useMemo(() => makeDerived(material, -0.15), [material]);
  const lighter = useMemo(() => makeDerived(material, 0.15, -0.05), [material]);

  switch (itemId) {
    case "sofa":
      return (
        <>
          <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.4, d * 0.7]} />
          </mesh>
          <mesh
            position={[0, h * 0.3, -d * 0.35 + d * 0.075]}
            castShadow
            receiveShadow
            material={darker}
          >
            <boxGeometry args={[w, h * 0.6, d * 0.15]} />
          </mesh>
          <mesh position={[-w * 0.46, h * 0.225, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.08, h * 0.45, d * 0.7]} />
          </mesh>
          <mesh position={[w * 0.46, h * 0.225, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.08, h * 0.45, d * 0.7]} />
          </mesh>
          <CornerLegs
            w={w * 0.84}
            d={d * 0.7}
            legH={h * 0.15}
            radius={0.02}
            material={darker}
            insetX={0.08}
            insetZ={0.08}
          />
        </>
      );

    case "armchair":
      return (
        <>
          <mesh position={[0, h * 0.2, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.4, d * 0.7]} />
          </mesh>
          <mesh
            position={[0, h * 0.3, -d * 0.35 + d * 0.075]}
            castShadow
            receiveShadow
            material={darker}
          >
            <boxGeometry args={[w, h * 0.6, d * 0.15]} />
          </mesh>
          <mesh position={[-w * 0.46, h * 0.225, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.08, h * 0.45, d * 0.7]} />
          </mesh>
          <mesh position={[w * 0.46, h * 0.225, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.08, h * 0.45, d * 0.7]} />
          </mesh>
          <CornerLegs
            w={w * 0.84}
            d={d * 0.7}
            legH={h * 0.15}
            radius={0.02}
            material={darker}
            insetX={0.08}
            insetZ={0.08}
          />
        </>
      );

    case "double-bed":
      return (
        <>
          <mesh position={[0, h * 0.1, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w, h * 0.2, d]} />
          </mesh>
          <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow material={lighter}>
            <boxGeometry args={[w * 0.95, h * 0.3, d * 0.9]} />
          </mesh>
          <mesh position={[0, h * 0.275, -d * 0.475]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.55, d * 0.05]} />
          </mesh>
          <mesh position={[-w * 0.2, h * 0.53, -d * 0.3]} castShadow material={lighter}>
            <boxGeometry args={[w * 0.35, h * 0.08, d * 0.15]} />
          </mesh>
          <mesh position={[w * 0.2, h * 0.53, -d * 0.3]} castShadow material={lighter}>
            <boxGeometry args={[w * 0.35, h * 0.08, d * 0.15]} />
          </mesh>
        </>
      );

    case "single-bed":
      return (
        <>
          <mesh position={[0, h * 0.1, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w, h * 0.2, d]} />
          </mesh>
          <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow material={lighter}>
            <boxGeometry args={[w * 0.95, h * 0.3, d * 0.9]} />
          </mesh>
          <mesh position={[0, h * 0.275, -d * 0.475]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.55, d * 0.05]} />
          </mesh>
          <mesh position={[0, h * 0.53, -d * 0.3]} castShadow material={lighter}>
            <boxGeometry args={[w * 0.35, h * 0.08, d * 0.15]} />
          </mesh>
        </>
      );

    case "dining-table":
      return (
        <>
          <mesh position={[0, h * 0.97, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.06, d]} />
          </mesh>
          <CornerLegs w={w} d={d} legH={h * 0.94} radius={0.02} material={darker} />
        </>
      );

    case "dining-chair":
      return (
        <>
          <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.9, h * 0.06, d * 0.7]} />
          </mesh>
          <mesh position={[0, h * 0.7, -d * 0.3]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 0.85, h * 0.45, 0.03]} />
          </mesh>
          <CornerLegs
            w={w * 0.9}
            d={d * 0.7}
            legH={h * 0.45}
            radius={0.015}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
        </>
      );

    case "coffee-table":
      return (
        <>
          <mesh position={[0, h * 0.92, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.08, d]} />
          </mesh>
          <CornerLegs w={w} d={d} legH={h * 0.84} radius={0.015} material={darker} />
        </>
      );

    case "tv-stand":
      return (
        <>
          <mesh position={[0, h * 0.35, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.7, d]} />
          </mesh>
          <mesh position={[0, h * 0.72, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
          </mesh>
        </>
      );

    case "wardrobe":
      return (
        <>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
          <mesh position={[0, h / 2, d * 0.46]} material={darker}>
            <boxGeometry args={[0.005, h * 0.9, d * 0.08]} />
          </mesh>
        </>
      );

    case "desk":
    case "office-desk":
      return (
        <>
          <mesh position={[0, h * 0.97, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.06, d]} />
          </mesh>
          <mesh position={[-w * 0.48, h * 0.47, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 0.04, h * 0.94, d * 0.95]} />
          </mesh>
          <mesh position={[w * 0.48, h * 0.47, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 0.04, h * 0.94, d * 0.95]} />
          </mesh>
          <mesh position={[0, h * 0.15, -d * 0.47]} receiveShadow material={darker}>
            <boxGeometry args={[w * 0.92, h * 0.3, 0.02]} />
          </mesh>
        </>
      );

    case "bathtub":
      return (
        <>
          <RoundedBox
            args={[w, h, d]}
            radius={0.05}
            smoothness={4}
            position={[0, h / 2, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.55, 0]} material={lighter}>
            <boxGeometry args={[w * 0.85, h * 0.5, d * 0.85]} />
          </mesh>
        </>
      );

    case "toilet":
      return (
        <>
          <mesh position={[0, h * 0.6, -d * 0.375]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.8, h * 0.4, d * 0.25]} />
          </mesh>
          <Cylinder
            args={[w * 0.35, w * 0.35, h * 0.35, 16]}
            position={[0, h * 0.175, d * 0.15]}
            castShadow
            receiveShadow
            material={lighter}
          />
        </>
      );

    case "refrigerator":
      return (
        <>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
          <mesh position={[0, h * 0.6, d * 0.505]} material={darker}>
            <boxGeometry args={[w * 1.01, 0.005, d * 0.01]} />
          </mesh>
        </>
      );

    case "stove": {
      const burnerPositions: [number, number, number][] = [
        [-w * 0.2, h * 0.93, -d * 0.2],
        [w * 0.2, h * 0.93, -d * 0.2],
        [-w * 0.2, h * 0.93, d * 0.2],
        [w * 0.2, h * 0.93, d * 0.2],
      ];
      return (
        <>
          <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h * 0.9, d]} />
          </mesh>
          <mesh position={[0, h * 0.915, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 1.01, h * 0.03, d * 1.01]} />
          </mesh>
          {burnerPositions.map((pos, i) => (
            <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} material={lighter}>
              <torusGeometry args={[0.06, 0.008, 8, 24]} />
            </mesh>
          ))}
        </>
      );
    }

    case "nightstand":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.85, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.5, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <CornerLegs
            w={w}
            d={d}
            legH={h * 0.1}
            radius={0.012}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
          <Sphere args={[0.015, 8, 8]} position={[0, h * 0.5, d * 0.51]} material={darker} />
        </>
      );

    case "dresser":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.85, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.5, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <CornerLegs
            w={w}
            d={d}
            legH={h * 0.1}
            radius={0.012}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
          {[0.3, 0.5, 0.7].map((frac) => (
            <mesh key={frac} position={[0, h * frac, d * 0.505]} material={darker}>
              <boxGeometry args={[w * 0.9, 0.005, 0.005]} />
            </mesh>
          ))}
          {[0.4, 0.6, 0.8].map((frac) => (
            <Sphere
              key={frac}
              args={[0.012, 8, 8]}
              position={[0, h * frac, d * 0.51]}
              material={darker}
            />
          ))}
        </>
      );

    case "bookshelf":
    case "bookcase":
      return (
        <>
          <RoundedBox
            args={[w, h, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h / 2, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          {[0.25, 0.5, 0.75].map((frac) => (
            <mesh key={frac} position={[0, h * frac, 0]} material={darker}>
              <boxGeometry args={[w * 0.95, 0.015, d * 0.95]} />
            </mesh>
          ))}
        </>
      );

    case "floor-lamp":
      return (
        <>
          <Cylinder
            args={[w * 0.4, w * 0.4, h * 0.03, 16]}
            position={[0, h * 0.015, 0]}
            castShadow
            receiveShadow
            material={darker}
          />
          <Cylinder
            args={[0.015, 0.015, h * 0.85, 8]}
            position={[0, h * 0.45, 0]}
            castShadow
            material={darker}
          />
          <Cylinder
            args={[w * 0.3, w * 0.15, h * 0.15, 16]}
            position={[0, h * 0.9, 0]}
            castShadow
            material={lighter}
          />
        </>
      );

    case "sink":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.1, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.85, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.78, 0]} material={lighter}>
            <boxGeometry args={[w * 0.6, h * 0.08, d * 0.5]} />
          </mesh>
          <Cylinder
            args={[w * 0.15, w * 0.2, h * 0.8, 8]}
            position={[0, h * 0.4, 0]}
            castShadow
            material={material}
          />
        </>
      );

    case "shower":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.05, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.025, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[-w * 0.49, h * 0.5, 0]} material={lighter}>
            <boxGeometry args={[0.02, h, d]} />
          </mesh>
          <mesh position={[0, h * 0.5, -d * 0.49]} material={lighter}>
            <boxGeometry args={[w, h, 0.02]} />
          </mesh>
          <Cylinder
            args={[0.01, 0.01, h * 0.9, 8]}
            position={[-w * 0.35, h * 0.5, -d * 0.4]}
            castShadow
            material={darker}
          />
          <Sphere
            args={[0.04, 8, 8]}
            position={[-w * 0.35, h * 0.95, -d * 0.4]}
            material={darker}
          />
        </>
      );

    case "filing-cabinet":
      return (
        <>
          <RoundedBox
            args={[w, h, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h / 2, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          {[0.25, 0.5, 0.75].map((frac) => (
            <mesh key={frac} position={[0, h * frac, d * 0.505]} material={darker}>
              <boxGeometry args={[w * 0.8, 0.005, 0.005]} />
            </mesh>
          ))}
          {[0.125, 0.375, 0.625, 0.875].map((frac) => (
            <Sphere
              key={frac}
              args={[0.01, 8, 8]}
              position={[0, h * frac, d * 0.52]}
              material={darker}
            />
          ))}
        </>
      );

    case "kitchen-island":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.85, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.5, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <CornerLegs
            w={w}
            d={d}
            legH={h * 0.1}
            radius={0.015}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
          <mesh position={[0, h * 0.94, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
          </mesh>
        </>
      );

    case "office-chair":
      return (
        <>
          <mesh position={[0, h * 0.45, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w * 0.85, h * 0.06, d * 0.7]} />
          </mesh>
          <mesh position={[0, h * 0.7, -d * 0.3]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 0.8, h * 0.4, 0.03]} />
          </mesh>
          <Cylinder
            args={[0.02, 0.02, h * 0.4, 8]}
            position={[0, h * 0.22, 0]}
            castShadow
            material={darker}
          />
          <Cylinder
            args={[w * 0.35, w * 0.35, h * 0.03, 16]}
            position={[0, h * 0.015, 0]}
            castShadow
            receiveShadow
            material={darker}
          />
        </>
      );

    default:
      return (
        <RoundedBox
          args={[w, h, d]}
          radius={0.02}
          smoothness={4}
          position={[0, h / 2, 0]}
          castShadow
          receiveShadow
          material={material}
        />
      );
  }
};

// Main component

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
        color: furnitureColor || item.color || "#909098",
        roughness: 0.5,
        metalness: 0.15,
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
      <group position={[0, -dimensions.h / 2, 0]}>
        <FurnitureModel
          itemId={item.id}
          w={dimensions.w}
          h={dimensions.h}
          d={dimensions.d}
          material={material}
        />
      </group>
    </group>
  );
};
