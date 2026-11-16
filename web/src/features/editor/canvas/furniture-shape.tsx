"use client";

import { memo } from "react";
import { Group } from "react-konva";
import { bathroomShape } from "./furniture-shape-bathroom";
import { bedroomShape } from "./furniture-shape-bedroom";
import { makeShapeKit } from "./furniture-shape-kit";
import { kitchenShape } from "./furniture-shape-kitchen";
import { livingRoomShape } from "./furniture-shape-living";
import { officeShape } from "./furniture-shape-office";

type FurnitureShapeProps = {
  item: string;
  width: number;
  depth: number;
  color: string;
};

const FurnitureOutline = ({ item, width, depth, color }: FurnitureShapeProps) => {
  const kit = makeShapeKit(width, depth, color);
  return (
    livingRoomShape(item, kit) ??
    bedroomShape(item, kit) ??
    kitchenShape(item, kit) ??
    bathroomShape(item, kit) ??
    officeShape(item, kit) ?? <Group>{kit.body()}</Group>
  );
};

export const FurnitureShape = memo(FurnitureOutline);
