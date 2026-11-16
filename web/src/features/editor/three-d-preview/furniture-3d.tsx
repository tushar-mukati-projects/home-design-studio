"use client";

import { useMemo, useEffect } from "react";
import { RoundedBox } from "@react-three/drei";
import { MeshStandardMaterial } from "three";
import type { Furniture } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { furnitureSize } from "@/lib/canvas";
import { shade } from "@/lib/colors";
import { M_PER_MM } from "@/lib/constants";
import type { Materials, ModelProps } from "./furniture-3d-parts";
import { LIVING_ROOM_ITEMS, LivingRoomModel } from "./furniture-3d-living";
import { BEDROOM_ITEMS, BedroomModel } from "./furniture-3d-bedroom";
import { KITCHEN_ITEMS, KitchenModel } from "./furniture-3d-kitchen";
import { BATHROOM_ITEMS, BathroomModel } from "./furniture-3d-bathroom";
import { OFFICE_ITEMS, OfficeModel } from "./furniture-3d-office";

const FURNITURE_ROUGHNESS = 0.5;
const FURNITURE_METALNESS = 0.15;
const DARKER_SHADE = -0.2;
const LIGHTER_SHADE = 0.4;

type Furniture3DProps = {
  placed: Furniture;
  offsetX: number;
  offsetZ: number;
  furnitureColor: string;
};

export const Furniture3D = ({ placed, offsetX, offsetZ, furnitureColor }: Furniture3DProps) => {
  const catalog = useEditorStore((s) => s.catalog);
  const [width, depth, height] = furnitureSize(placed, catalog);

  const materials = useMemo(() => furnitureMaterials(furnitureColor), [furnitureColor]);
  useEffect(
    () => () => {
      materials.base.dispose();
      materials.darker.dispose();
      materials.lighter.dispose();
    },
    [materials],
  );

  const w = width * M_PER_MM;
  const d = depth * M_PER_MM;
  const h = height * M_PER_MM;

  return (
    <group
      position={[placed.at[0] * M_PER_MM - offsetX, h / 2, placed.at[1] * M_PER_MM - offsetZ]}
      rotation={[0, -(placed.rotation * Math.PI) / 180, 0]}
    >
      <group position={[0, -h / 2, 0]}>
        <FurnitureModel item={placed.item} w={w} h={h} d={d} materials={materials} />
      </group>
    </group>
  );
};

const furnitureMaterial = (color: string) =>
  new MeshStandardMaterial({
    color,
    roughness: FURNITURE_ROUGHNESS,
    metalness: FURNITURE_METALNESS,
  });

const furnitureMaterials = (color: string): Materials => ({
  base: furnitureMaterial(color),
  darker: furnitureMaterial(shade(color, DARKER_SHADE)),
  lighter: furnitureMaterial(shade(color, LIGHTER_SHADE)),
});

const FurnitureModel = (props: ModelProps) => {
  if (LIVING_ROOM_ITEMS.includes(props.item)) return <LivingRoomModel {...props} />;
  if (BEDROOM_ITEMS.includes(props.item)) return <BedroomModel {...props} />;
  if (KITCHEN_ITEMS.includes(props.item)) return <KitchenModel {...props} />;
  if (BATHROOM_ITEMS.includes(props.item)) return <BathroomModel {...props} />;
  if (OFFICE_ITEMS.includes(props.item)) return <OfficeModel {...props} />;
  return (
    <RoundedBox
      args={[props.w, props.h, props.d]}
      radius={0.02}
      smoothness={4}
      position={[0, props.h / 2, 0]}
      castShadow
      receiveShadow
      material={props.materials.base}
    />
  );
};
