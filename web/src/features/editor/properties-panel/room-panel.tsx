"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ROOM_USAGE_LABELS } from "@/lib/canvas";
import { formatArea } from "@/lib/constants";
import { polygonArea, ROOM_USAGES, type Room, type RoomUsage } from "@/shared/canvas";
import { useEditorStore } from "@/stores/editor-store";
import { DeleteButton, FieldLabel, Row, Section } from "./fields";

const ROOM_USAGE_OPTIONS = ROOM_USAGES.map((value) => ({ value, label: ROOM_USAGE_LABELS[value] }));

type RoomPanelProps = {
  room: Room;
};

export const RoomPanel = ({ room }: RoomPanelProps) => {
  const updateRoom = useEditorStore((s) => s.updateRoom);
  const removeElement = useEditorStore((s) => s.removeElement);

  const commitName = (input: HTMLInputElement) => {
    const name = input.value.trim();
    if (!name) input.value = room.name;
    else if (name !== room.name) updateRoom(room.id, { name });
  };

  return (
    <Section title="Room Properties">
      <div>
        <FieldLabel>Room Name</FieldLabel>
        <Input
          defaultValue={room.name}
          key={`room-name-${room.id}`}
          onBlur={(e) => commitName(e.currentTarget)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitName(e.currentTarget);
          }}
          className="h-8 text-xs"
        />
      </div>

      <div>
        <FieldLabel>Room Type</FieldLabel>
        <Select
          value={room.usage}
          options={ROOM_USAGE_OPTIONS}
          onValueChange={(usage) => updateRoom(room.id, { usage: usage as RoomUsage })}
        />
      </div>

      <Separator />
      <Row label="Area" value={formatArea(polygonArea(room.polygon))} />
      <Separator />
      <DeleteButton label="Delete Room" onClick={() => removeElement(room.id)} />
    </Section>
  );
};
