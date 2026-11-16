import { z } from "zod";

import type { Collaborator } from "@/stores/collaboration-store";

export const COLLABORATOR_COLORS = [
  "#e11d48",
  "#db2777",
  "#9333ea",
  "#4f46e5",
  "#2563eb",
  "#0891b2",
  "#059669",
  "#65a30d",
  "#d97706",
  "#ea580c",
] as const;
const MEMBER_NAME_MAX_CHARS = 80;
const GUEST_ID_CHARS = 6;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const awarenessStateSchema = z.object({
  clientId: z.number().int(),
  user: z.object({
    name: z.string().refine((name) => Array.from(name).length <= MEMBER_NAME_MAX_CHARS),
    color: z.string().regex(HEX_COLOR),
  }),
  cursor: z.object({ x: z.number().finite(), y: z.number().finite() }).optional(),
});

export const collaboratorsFromAwareness = (
  states: unknown[],
  localClientId: number,
  previous: Collaborator[],
  now: number,
): Collaborator[] => {
  const previousById = new Map(previous.map((collaborator) => [collaborator.id, collaborator]));
  const collaborators: Collaborator[] = [];
  for (const state of states) {
    const parsed = awarenessStateSchema.safeParse(state);
    if (!parsed.success) continue;
    const { clientId, user, cursor } = parsed.data;
    if (clientId === localClientId || !cursor) continue;
    const before = previousById.get(clientId);
    const unmoved = before !== undefined && before.x === cursor.x && before.y === cursor.y;
    collaborators.push({
      id: clientId,
      name: user.name,
      color: user.color,
      x: cursor.x,
      y: cursor.y,
      lastSeen: unmoved ? before.lastSeen : now,
    });
  }
  return collaborators;
};

export const pickCollaboratorColor = (): string =>
  COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];

export const memberName = (displayName: string | null, uid: string): string =>
  Array.from(displayName?.trim() || `Guest ${uid.slice(0, GUEST_ID_CHARS)}`)
    .slice(0, MEMBER_NAME_MAX_CHARS)
    .join("");
