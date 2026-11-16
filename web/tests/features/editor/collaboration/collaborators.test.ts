import { describe, expect, test } from "bun:test";

import {
  COLLABORATOR_COLORS,
  collaboratorsFromAwareness,
  memberName,
  pickCollaboratorColor,
} from "@/features/editor/collaboration/collaborators";
import type { Collaborator } from "@/stores/collaboration-store";

const LOCAL_CLIENT = 1;
const NOW = 1_000;
const EARLIER = 500;
const user = { name: "Ana", color: "#2563eb" };

const seen = (overrides: Partial<Collaborator> = {}): Collaborator => ({
  id: 2,
  name: "Ana",
  color: "#2563eb",
  x: 10,
  y: 20,
  lastSeen: NOW,
  ...overrides,
});

describe("collaboratorsFromAwareness", () => {
  test.each<[string, unknown, Collaborator[]]>([
    ["a peer with a cursor", { clientId: 2, user, cursor: { x: 10, y: 20 } }, [seen()]],
    [
      "an uppercase hex colour as given",
      { clientId: 2, user: { name: "Ana", color: "#2563EB" }, cursor: { x: 10, y: 20 } },
      [seen({ color: "#2563EB" })],
    ],
    [
      "a name as given, hyphens included",
      { clientId: 2, user: { name: "ana-maria", color: "#2563eb" }, cursor: { x: 10, y: 20 } },
      [seen({ name: "ana-maria" })],
    ],
    ["the local client", { clientId: LOCAL_CLIENT, user, cursor: { x: 1, y: 1 } }, []],
    ["a peer who never moved", { clientId: 2, user }, []],
    [
      "a non-string name",
      { clientId: 2, user: { name: 7, color: "#2563eb" }, cursor: { x: 0, y: 0 } },
      [],
    ],
    [
      "a name over 80 characters",
      { clientId: 2, user: { name: "x".repeat(81), color: "#2563eb" }, cursor: { x: 0, y: 0 } },
      [],
    ],
    [
      "a colour that is not hex",
      { clientId: 2, user: { name: "Ana", color: "red" }, cursor: { x: 0, y: 0 } },
      [],
    ],
    [
      "a three-digit hex colour",
      { clientId: 2, user: { name: "Ana", color: "#fff" }, cursor: { x: 0, y: 0 } },
      [],
    ],
    ["an infinite cursor", { clientId: 2, user, cursor: { x: Infinity, y: 0 } }, []],
    ["a NaN cursor", { clientId: 2, user, cursor: { x: 0, y: NaN } }, []],
    ["a string cursor", { clientId: 2, user, cursor: "10,20" }, []],
    ["a state without a user", { clientId: 2, cursor: { x: 0, y: 0 } }, []],
    ["a state without a clientId", { user, cursor: { x: 0, y: 0 } }, []],
    ["a null state", null, []],
    ["a string state", "Ana", []],
  ])("maps %s", (_label, state, expected) => {
    expect(collaboratorsFromAwareness([state], LOCAL_CLIENT, [], NOW)).toEqual(expected);
  });

  test("keeps lastSeen while a cursor stays put and refreshes it when it moves", () => {
    const previous = [seen({ lastSeen: EARLIER }), seen({ id: 3, x: 0, y: 0, lastSeen: EARLIER })];
    const states = [
      { clientId: 2, user, cursor: { x: 10, y: 20 } },
      { clientId: 3, user, cursor: { x: 5, y: 0 } },
    ];
    expect(collaboratorsFromAwareness(states, LOCAL_CLIENT, previous, NOW)).toEqual([
      seen({ lastSeen: EARLIER }),
      seen({ id: 3, x: 5, y: 0, lastSeen: NOW }),
    ]);
  });

  test("drops a collaborator whose state is gone", () => {
    expect(collaboratorsFromAwareness([], LOCAL_CLIENT, [seen()], NOW)).toEqual([]);
  });
});

describe("collaborator colours", () => {
  test.each(COLLABORATOR_COLORS.map((color) => [color]))(
    "%s passes the awareness check",
    (color) => {
      const state = { clientId: 2, user: { name: "Ana", color }, cursor: { x: 0, y: 0 } };
      expect(collaboratorsFromAwareness([state], LOCAL_CLIENT, [], NOW)).toHaveLength(1);
    },
  );

  test("pickCollaboratorColor only picks from the palette", () => {
    const palette = new Set<string>(COLLABORATOR_COLORS);
    for (let i = 0; i < 50; i++) expect(palette.has(pickCollaboratorColor())).toBe(true);
  });
});

describe("memberName", () => {
  test.each<[string | null, string]>([
    ["Ana Lima", "Ana Lima"],
    [null, "Guest abc123"],
    ["", "Guest abc123"],
    ["   ", "Guest abc123"],
  ])("names %j", (displayName, expected) => {
    expect(memberName(displayName, "abc123xyz")).toBe(expected);
  });

  test.each(["x", "😀"])("a long %s name is cut whole so peers still accept it", (char) => {
    const name = memberName(char.repeat(100), "abc123xyz");
    expect(name).toBe(char.repeat(80));
    const state = { clientId: 2, user: { name, color: "#2563eb" }, cursor: { x: 0, y: 0 } };
    expect(collaboratorsFromAwareness([state], LOCAL_CLIENT, [], NOW)).toHaveLength(1);
  });
});
