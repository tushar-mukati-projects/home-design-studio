"use client";

import { useMemo, useEffect } from "react";
import { RoundedBox, Cylinder, Sphere } from "@react-three/drei";
import { MeshStandardMaterial, Color } from "three";
import type { PlacedFurniture } from "@/types";

const SCALE = 0.01;

const CHROME = new MeshStandardMaterial({
  color: "#b8b8c0",
  roughness: 0.1,
  metalness: 0.85,
});

const GLASS = new MeshStandardMaterial({
  color: "#d8eef8",
  transparent: true,
  opacity: 0.2,
  roughness: 0.02,
  metalness: 0.05,
});

const BOOK_MATS = [
  new MeshStandardMaterial({ color: "#c44e52", roughness: 0.7 }),
  new MeshStandardMaterial({ color: "#4c8bf5", roughness: 0.7 }),
  new MeshStandardMaterial({ color: "#48a56a", roughness: 0.7 }),
  new MeshStandardMaterial({ color: "#f0a030", roughness: 0.7 }),
  new MeshStandardMaterial({ color: "#7b5ea7", roughness: 0.7 }),
  new MeshStandardMaterial({ color: "#e87040", roughness: 0.7 }),
];

function makeDerived(
  base: MeshStandardMaterial,
  lightnessOffset: number,
  saturationOffset = 0,
  hueOffset = 0,
): MeshStandardMaterial {
  const c = new Color(base.color.getHex());
  c.offsetHSL(hueOffset, saturationOffset, lightnessOffset);
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
  const darker = useMemo(() => makeDerived(material, -0.18, 0.08, 0.03), [material]);
  const lighter = useMemo(() => makeDerived(material, 0.22, -0.06, -0.02), [material]);

  useEffect(
    () => () => {
      darker.dispose();
      lighter.dispose();
    },
    [darker, lighter],
  );

  switch (itemId) {
    case "sofa": {
      const legH = h * 0.07;
      const armW = w * 0.09;
      const innerW = w - armW * 2;
      const n = 3;
      const gap = w * 0.008;
      const cW = (innerW - gap * (n - 1)) / n;
      const seatBase = legH + h * 0.08;
      const seatH = h * 0.2;

      return (
        <>
          <CornerLegs w={w * 0.86} d={d * 0.65} legH={legH} radius={0.015} material={darker} />
          <RoundedBox
            args={[w, h * 0.08, d * 0.78]}
            radius={0.012}
            smoothness={3}
            position={[0, legH + h * 0.04, d * 0.04]}
            castShadow
            receiveShadow
            material={darker}
          />
          {Array.from({ length: n }, (_, i) => (
            <RoundedBox
              key={`s${i}`}
              args={[cW * 0.96, seatH, d * 0.56]}
              radius={0.04}
              smoothness={4}
              position={[-innerW / 2 + cW / 2 + i * (cW + gap), seatBase + seatH / 2, d * 0.08]}
              castShadow
              receiveShadow
              material={material}
            />
          ))}
          <RoundedBox
            args={[w * 0.96, h * 0.56, d * 0.08]}
            radius={0.015}
            smoothness={3}
            position={[0, legH + h * 0.36, -d * 0.37]}
            castShadow
            receiveShadow
            material={darker}
          />
          {Array.from({ length: n }, (_, i) => (
            <RoundedBox
              key={`b${i}`}
              args={[cW * 0.94, h * 0.32, d * 0.13]}
              radius={0.035}
              smoothness={4}
              position={[
                -innerW / 2 + cW / 2 + i * (cW + gap),
                seatBase + seatH + h * 0.16,
                -d * 0.25,
              ]}
              castShadow
              receiveShadow
              material={lighter}
            />
          ))}
          <RoundedBox
            args={[armW, h * 0.28, d * 0.66]}
            radius={0.035}
            smoothness={4}
            position={[-w / 2 + armW / 2, seatBase + h * 0.14, d * 0.02]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[armW, h * 0.28, d * 0.66]}
            radius={0.035}
            smoothness={4}
            position={[w / 2 - armW / 2, seatBase + h * 0.14, d * 0.02]}
            castShadow
            receiveShadow
            material={material}
          />
        </>
      );
    }

    case "armchair": {
      const legH = h * 0.07;
      const armW = w * 0.15;
      const seatBase = legH + h * 0.08;
      const seatH = h * 0.22;

      return (
        <>
          <CornerLegs w={w * 0.76} d={d * 0.68} legH={legH} radius={0.015} material={darker} />
          <RoundedBox
            args={[w, h * 0.08, d * 0.76]}
            radius={0.012}
            smoothness={3}
            position={[0, legH + h * 0.04, d * 0.04]}
            castShadow
            receiveShadow
            material={darker}
          />
          <RoundedBox
            args={[w * 0.68, seatH, d * 0.56]}
            radius={0.055}
            smoothness={4}
            position={[0, seatBase + seatH / 2, d * 0.06]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.9, h * 0.58, d * 0.08]}
            radius={0.02}
            smoothness={3}
            position={[0, legH + h * 0.37, -d * 0.37]}
            castShadow
            receiveShadow
            material={darker}
          />
          <RoundedBox
            args={[w * 0.62, h * 0.36, d * 0.14]}
            radius={0.05}
            smoothness={4}
            position={[0, seatBase + seatH + h * 0.18, -d * 0.24]}
            castShadow
            receiveShadow
            material={lighter}
          />
          <RoundedBox
            args={[armW, h * 0.28, d * 0.62]}
            radius={0.04}
            smoothness={4}
            position={[-w / 2 + armW / 2 + w * 0.02, seatBase + h * 0.14, d * 0.02]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[armW, h * 0.28, d * 0.62]}
            radius={0.04}
            smoothness={4}
            position={[w / 2 - armW / 2 - w * 0.02, seatBase + h * 0.14, d * 0.02]}
            castShadow
            receiveShadow
            material={material}
          />
        </>
      );
    }

    case "coffee-table":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.08, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.92, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.25, 0]} castShadow receiveShadow material={lighter}>
            <boxGeometry args={[w * 0.85, h * 0.04, d * 0.85]} />
          </mesh>
          <CornerLegs w={w} d={d} legH={h * 0.88} radius={0.015} material={darker} />
        </>
      );

    case "tv-stand":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.68, d]}
            radius={0.02}
            smoothness={3}
            position={[0, h * 0.36, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.72, 0]} castShadow receiveShadow material={darker}>
            <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
          </mesh>
          <mesh position={[0, h * 0.35, d * 0.3]} material={darker}>
            <boxGeometry args={[w * 0.8, h * 0.25, d * 0.4]} />
          </mesh>
        </>
      );

    case "bookshelf":
    case "bookcase": {
      const shelves = [0.25, 0.5, 0.75];
      const bookRows = [
        [
          { x: -0.3, bw: 0.2, bh: 0.19 },
          { x: -0.05, bw: 0.22, bh: 0.21 },
          { x: 0.2, bw: 0.18, bh: 0.17 },
        ],
        [
          { x: -0.25, bw: 0.24, bh: 0.2 },
          { x: 0.05, bw: 0.16, bh: 0.18 },
          { x: 0.28, bw: 0.2, bh: 0.22 },
        ],
        [
          { x: -0.28, bw: 0.18, bh: 0.18 },
          { x: -0.04, bw: 0.2, bh: 0.21 },
          { x: 0.22, bw: 0.22, bh: 0.19 },
        ],
      ];

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
          {shelves.map((frac) => (
            <mesh key={frac} position={[0, h * frac, 0]} material={darker}>
              <boxGeometry args={[w * 0.95, 0.015, d * 0.95]} />
            </mesh>
          ))}
          {bookRows.map((row, si) =>
            row.map((b, bi) => {
              const shelfTop = h * (si === 0 ? 0 : shelves[si - 1]!) + 0.01;
              return (
                <mesh
                  key={`${si}-${bi}`}
                  position={[b.x * w, shelfTop + (h * b.bh) / 2, 0]}
                  material={BOOK_MATS[(si * 3 + bi) % BOOK_MATS.length]}
                >
                  <boxGeometry args={[w * b.bw, h * b.bh, d * 0.75]} />
                </mesh>
              );
            }),
          )}
        </>
      );
    }

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

    case "double-bed": {
      const frameH = h * 0.18;
      const mattH = h * 0.25;
      const pillowH = h * 0.1;

      return (
        <>
          <RoundedBox
            args={[w, frameH, d]}
            radius={0.02}
            smoothness={3}
            position={[0, frameH / 2, 0]}
            castShadow
            receiveShadow
            material={darker}
          />
          <RoundedBox
            args={[w * 0.96, mattH, d * 0.92]}
            radius={0.04}
            smoothness={4}
            position={[0, frameH + mattH / 2, 0]}
            castShadow
            receiveShadow
            material={lighter}
          />
          <RoundedBox
            args={[w, h * 0.55, d * 0.05]}
            radius={0.025}
            smoothness={3}
            position={[0, h * 0.275, -d * 0.475]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.28, pillowH, d * 0.18]}
            radius={0.04}
            smoothness={4}
            position={[-w * 0.2, frameH + mattH + pillowH / 2, -d * 0.3]}
            castShadow
            material={lighter}
          />
          <RoundedBox
            args={[w * 0.28, pillowH, d * 0.18]}
            radius={0.04}
            smoothness={4}
            position={[w * 0.2, frameH + mattH + pillowH / 2, -d * 0.3]}
            castShadow
            material={lighter}
          />
          <RoundedBox
            args={[w * 0.92, h * 0.08, d * 0.5]}
            radius={0.03}
            smoothness={3}
            position={[0, frameH + mattH + h * 0.04, d * 0.15]}
            castShadow
            material={material}
          />
        </>
      );
    }

    case "single-bed": {
      const frameH = h * 0.18;
      const mattH = h * 0.25;

      return (
        <>
          <RoundedBox
            args={[w, frameH, d]}
            radius={0.02}
            smoothness={3}
            position={[0, frameH / 2, 0]}
            castShadow
            receiveShadow
            material={darker}
          />
          <RoundedBox
            args={[w * 0.96, mattH, d * 0.92]}
            radius={0.04}
            smoothness={4}
            position={[0, frameH + mattH / 2, 0]}
            castShadow
            receiveShadow
            material={lighter}
          />
          <RoundedBox
            args={[w, h * 0.55, d * 0.05]}
            radius={0.025}
            smoothness={3}
            position={[0, h * 0.275, -d * 0.475]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.3, h * 0.1, d * 0.18]}
            radius={0.04}
            smoothness={4}
            position={[0, frameH + mattH + h * 0.05, -d * 0.3]}
            castShadow
            material={lighter}
          />
          <RoundedBox
            args={[w * 0.92, h * 0.08, d * 0.45]}
            radius={0.03}
            smoothness={3}
            position={[0, frameH + mattH + h * 0.04, d * 0.15]}
            castShadow
            material={material}
          />
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
          <mesh position={[0, h * 0.5, d * 0.505]} material={darker}>
            <boxGeometry args={[w * 0.85, 0.004, 0.004]} />
          </mesh>
          <Sphere args={[0.015, 8, 8]} position={[0, h * 0.62, d * 0.52]} material={CHROME} />
        </>
      );

    case "wardrobe":
      return (
        <>
          <mesh position={[0, h / 2, 0]} castShadow receiveShadow material={material}>
            <boxGeometry args={[w, h, d]} />
          </mesh>
          <mesh position={[0, h / 2, d * 0.505]} material={darker}>
            <boxGeometry args={[0.005, h * 0.92, 0.005]} />
          </mesh>
          <mesh position={[-w * 0.25, h / 2, d * 0.502]} material={darker}>
            <boxGeometry args={[w * 0.45, h * 0.9, 0.006]} />
          </mesh>
          <mesh position={[w * 0.25, h / 2, d * 0.502]} material={darker}>
            <boxGeometry args={[w * 0.45, h * 0.9, 0.006]} />
          </mesh>
          <Cylinder
            args={[0.008, 0.008, h * 0.08, 8]}
            position={[-w * 0.04, h * 0.52, d * 0.53]}
            material={CHROME}
          />
          <Cylinder
            args={[0.008, 0.008, h * 0.08, 8]}
            position={[w * 0.04, h * 0.52, d * 0.53]}
            material={CHROME}
          />
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
            <Cylinder
              key={frac}
              args={[0.006, 0.006, w * 0.08, 8]}
              rotation={[0, 0, Math.PI / 2]}
              position={[0, h * frac, d * 0.52]}
              material={CHROME}
            />
          ))}
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

    case "dining-table":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.06, d]}
            radius={0.015}
            smoothness={4}
            position={[0, h * 0.97, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <CornerLegs w={w} d={d} legH={h * 0.94} radius={0.02} material={darker} />
        </>
      );

    case "dining-chair": {
      const seatY = h * 0.45;
      const seatH = h * 0.06;
      const slats = [-0.22, 0, 0.22];

      return (
        <>
          <RoundedBox
            args={[w * 0.88, seatH, d * 0.7]}
            radius={0.015}
            smoothness={3}
            position={[0, seatY, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          {slats.map((frac) => (
            <RoundedBox
              key={frac}
              args={[w * 0.12, h * 0.38, 0.018]}
              radius={0.006}
              smoothness={3}
              position={[frac * w * 0.8, h * 0.68, -d * 0.32]}
              castShadow
              material={darker}
            />
          ))}
          <RoundedBox
            args={[w * 0.82, h * 0.04, 0.022]}
            radius={0.006}
            smoothness={3}
            position={[0, h * 0.89, -d * 0.32]}
            castShadow
            material={darker}
          />
          <CornerLegs
            w={w * 0.9}
            d={d * 0.7}
            legH={seatY - seatH / 2}
            radius={0.015}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
        </>
      );
    }

    case "kitchen-island":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.82, d]}
            radius={0.02}
            smoothness={4}
            position={[0, h * 0.47, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <CornerLegs
            w={w}
            d={d}
            legH={h * 0.08}
            radius={0.015}
            material={darker}
            insetX={0.05}
            insetZ={0.05}
          />
          <RoundedBox
            args={[w * 1.04, h * 0.04, d * 1.04]}
            radius={0.012}
            smoothness={3}
            position={[0, h * 0.92, 0]}
            castShadow
            receiveShadow
            material={darker}
          />
        </>
      );

    case "refrigerator":
      return (
        <>
          <RoundedBox
            args={[w, h, d]}
            radius={0.02}
            smoothness={3}
            position={[0, h / 2, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.65, d * 0.505]} material={darker}>
            <boxGeometry args={[w * 0.98, 0.008, 0.008]} />
          </mesh>
          <Cylinder
            args={[0.008, 0.008, h * 0.2, 8]}
            position={[w * 0.42, h * 0.78, d * 0.54]}
            material={CHROME}
          />
          <Cylinder
            args={[0.008, 0.008, h * 0.28, 8]}
            position={[w * 0.42, h * 0.4, d * 0.54]}
            material={CHROME}
          />
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
          <Cylinder
            args={[0.006, 0.006, w * 0.5, 8]}
            rotation={[0, 0, Math.PI / 2]}
            position={[0, h * 0.6, d * 0.52]}
            material={CHROME}
          />
        </>
      );
    }

    case "bathtub":
      return (
        <>
          <RoundedBox
            args={[w, h, d]}
            radius={0.06}
            smoothness={4}
            position={[0, h / 2, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.88, h * 0.45, d * 0.82]}
            radius={0.04}
            smoothness={4}
            position={[0, h * 0.55, 0]}
            material={lighter}
          />
          <mesh position={[0, h * 0.99, 0]} material={lighter}>
            <boxGeometry args={[w * 0.99, h * 0.03, d * 0.99]} />
          </mesh>
          <Cylinder
            args={[0.015, 0.015, h * 0.25, 8]}
            position={[w * 0.35, h + h * 0.12, -d * 0.35]}
            castShadow
            material={CHROME}
          />
          <Cylinder
            args={[0.012, 0.012, 0.08, 8]}
            rotation={[Math.PI * 0.35, 0, 0]}
            position={[w * 0.35, h + h * 0.22, -d * 0.3]}
            castShadow
            material={CHROME}
          />
        </>
      );

    case "toilet": {
      const bowlR = w * 0.38;

      return (
        <>
          <RoundedBox
            args={[w * 0.82, h * 0.65, d * 0.2]}
            radius={0.025}
            smoothness={4}
            position={[0, h * 0.325, -d * 0.38]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.85, h * 0.06, d * 0.22]}
            radius={0.015}
            smoothness={3}
            position={[0, h * 0.68, -d * 0.38]}
            castShadow
            material={lighter}
          />
          <RoundedBox
            args={[w * 0.48, h * 0.22, d * 0.18]}
            radius={0.015}
            smoothness={3}
            position={[0, h * 0.18, -d * 0.18]}
            material={material}
          />
          <Cylinder
            args={[bowlR, bowlR * 0.7, h * 0.35, 20]}
            position={[0, h * 0.175, d * 0.12]}
            castShadow
            receiveShadow
            material={material}
          />
          <Cylinder
            args={[bowlR * 1.05, bowlR * 1.05, h * 0.04, 20]}
            position={[0, h * 0.375, d * 0.12]}
            castShadow
            material={lighter}
          />
          <Cylinder
            args={[0.015, 0.015, 0.008, 12]}
            position={[0, h * 0.72, -d * 0.38]}
            material={CHROME}
          />
        </>
      );
    }

    case "sink":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.82, d]}
            radius={0.02}
            smoothness={3}
            position={[0, h * 0.41, 0]}
            castShadow
            receiveShadow
            material={material}
          />
          <mesh position={[0, h * 0.84, 0]} castShadow receiveShadow material={lighter}>
            <boxGeometry args={[w * 1.02, h * 0.04, d * 1.02]} />
          </mesh>
          <Cylinder
            args={[w * 0.28, w * 0.22, h * 0.08, 20]}
            position={[0, h * 0.82, d * 0.08]}
            material={lighter}
          />
          <Cylinder
            args={[0.018, 0.018, h * 0.12, 8]}
            position={[0, h * 0.92, -d * 0.28]}
            castShadow
            material={CHROME}
          />
          <Cylinder
            args={[0.01, 0.01, d * 0.18, 8]}
            rotation={[Math.PI * 0.4, 0, 0]}
            position={[0, h * 0.98, -d * 0.18]}
            castShadow
            material={CHROME}
          />
          <Cylinder
            args={[0.006, 0.006, w * 0.1, 8]}
            rotation={[0, 0, Math.PI / 2]}
            position={[0, h * 0.5, d * 0.52]}
            material={CHROME}
          />
        </>
      );

    case "shower":
      return (
        <>
          <RoundedBox
            args={[w, h * 0.02, d]}
            radius={0.01}
            smoothness={3}
            position={[0, h * 0.01, 0]}
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
          <mesh position={[w * 0.49, h * 0.5, 0]} material={GLASS}>
            <boxGeometry args={[0.015, h * 0.95, d * 0.98]} />
          </mesh>
          <mesh position={[w * 0.15, h * 0.5, d * 0.49]} material={GLASS}>
            <boxGeometry args={[w * 0.65, h * 0.95, 0.015]} />
          </mesh>
          <mesh position={[w * 0.49, h * 0.975, 0]} material={CHROME}>
            <boxGeometry args={[0.01, 0.01, d]} />
          </mesh>
          <mesh position={[w * 0.15, h * 0.975, d * 0.49]} material={CHROME}>
            <boxGeometry args={[w * 0.65, 0.01, 0.01]} />
          </mesh>
          <Cylinder
            args={[0.012, 0.012, h * 0.8, 8]}
            position={[-w * 0.35, h * 0.5, -d * 0.4]}
            castShadow
            material={CHROME}
          />
          <Cylinder
            args={[0.04, 0.015, 0.025, 12]}
            position={[-w * 0.35, h * 0.92, -d * 0.4]}
            castShadow
            material={CHROME}
          />
          <Cylinder
            args={[0.008, 0.008, 0.08, 8]}
            rotation={[Math.PI / 2, 0, 0]}
            position={[-w * 0.35, h * 0.9, -d * 0.36]}
            material={CHROME}
          />
        </>
      );

    case "office-chair": {
      const starR = w * 0.38;
      const liftH = h * 0.32;
      const seatY = liftH + 0.03;

      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i * Math.PI * 2) / 5;
            return (
              <group key={i} rotation={[0, angle, 0]}>
                <Cylinder
                  args={[0.012, 0.012, starR, 6]}
                  position={[0, 0.015, starR / 2]}
                  rotation={[Math.PI / 2, 0, 0]}
                  material={darker}
                />
                <Sphere args={[0.018, 6, 6]} position={[0, 0.012, starR]} material={darker} />
              </group>
            );
          })}
          <Cylinder
            args={[0.02, 0.025, liftH, 8]}
            position={[0, liftH / 2 + 0.02, 0]}
            castShadow
            material={darker}
          />
          <RoundedBox
            args={[w * 0.82, h * 0.06, d * 0.7]}
            radius={0.025}
            smoothness={4}
            position={[0, seatY + h * 0.03, d * 0.02]}
            castShadow
            receiveShadow
            material={material}
          />
          <RoundedBox
            args={[w * 0.76, h * 0.35, 0.035]}
            radius={0.025}
            smoothness={4}
            position={[0, seatY + h * 0.24, -d * 0.32]}
            castShadow
            receiveShadow
            material={darker}
          />
          <Cylinder
            args={[0.012, 0.012, h * 0.12, 8]}
            position={[-w * 0.38, seatY + h * 0.09, -d * 0.05]}
            material={darker}
          />
          <RoundedBox
            args={[0.025, 0.015, d * 0.2]}
            radius={0.005}
            smoothness={3}
            position={[-w * 0.38, seatY + h * 0.16, -d * 0.05]}
            material={darker}
          />
          <Cylinder
            args={[0.012, 0.012, h * 0.12, 8]}
            position={[w * 0.38, seatY + h * 0.09, -d * 0.05]}
            material={darker}
          />
          <RoundedBox
            args={[0.025, 0.015, d * 0.2]}
            radius={0.005}
            smoothness={3}
            position={[w * 0.38, seatY + h * 0.16, -d * 0.05]}
            material={darker}
          />
        </>
      );
    }

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
            <Cylinder
              key={frac}
              args={[0.006, 0.006, w * 0.12, 8]}
              rotation={[0, 0, Math.PI / 2]}
              position={[0, h * frac, d * 0.53]}
              material={CHROME}
            />
          ))}
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

  useEffect(() => () => material.dispose(), [material]);

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
          itemId={item.icon ?? item.id}
          w={dimensions.w}
          h={dimensions.h}
          d={dimensions.d}
          material={material}
        />
      </group>
    </group>
  );
};
