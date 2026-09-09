"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { createCollaborationProvider, destroyProvider } from "@/lib/yjs-provider";
import { auth } from "@/lib/firebase";
import { useEditorStore } from "@/stores/editor-store";
import { useCollaborationStore, type CollaboratorCursor } from "@/stores/collaboration-store";
import type { Canvas } from "@/types";

type CollectionKey = "walls" | "openings" | "rooms" | "furniture";
const COLLECTION_KEYS: CollectionKey[] = ["walls", "openings", "rooms", "furniture"];
const META_KEY = "meta";

interface HasId {
  id: string;
}

const LOCAL_ORIGIN = "local";

const syncArrayToYMap = <T extends HasId>(
  doc: Y.Doc,
  yMap: Y.Map<unknown>,
  items: T[],
  prev: T[] = [],
): void => {
  const prevById = new Map(prev.map((i) => [i.id, i]));
  doc.transact(() => {
    const newIds = new Set(items.map((i) => i.id));
    for (const id of yMap.keys()) if (!newIds.has(id)) yMap.delete(id);
    for (const item of items) {
      if (prevById.get(item.id) !== item || !yMap.has(item.id)) {
        yMap.set(item.id, structuredClone(item));
      }
    }
  }, LOCAL_ORIGIN);
};

const yMapToArray = <T>(yMap: Y.Map<unknown>): T[] => {
  const result: T[] = [];
  yMap.forEach((value) => result.push(value as T));
  return result;
};

const readAll = (maps: Map<CollectionKey, Y.Map<unknown>>) => ({
  walls: yMapToArray<Canvas["walls"][number]>(maps.get("walls")!),
  openings: yMapToArray<Canvas["openings"][number]>(maps.get("openings")!),
  rooms: yMapToArray<Canvas["rooms"][number]>(maps.get("rooms")!),
  furniture: yMapToArray<Canvas["furniture"][number]>(maps.get("furniture")!),
});

interface AwarenessUserState {
  user?: { name: string; color: string; permission?: string };
  cursor?: { x: number; y: number };
}

interface DesignMeta {
  name: string;
  isOwner: boolean;
  canEdit: boolean;
}

export const useCollaboration = (designId: string, enabled: boolean) => {
  const providerRef = useRef<HocuspocusProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const isRemoteUpdateRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  const [designMeta, setDesignMeta] = useState<DesignMeta>({
    name: "Untitled Design",
    isOwner: true,
    canEdit: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);
  const [generation, setGeneration] = useState(0);
  const canEditRef = useRef(true);
  const cursorsRef = useRef<Map<number, CollaboratorCursor>>(new Map());

  const isConnected = useCollaborationStore((s) => s.isConnected);
  const isSynced = useCollaborationStore((s) => s.isSynced);
  const setConnected = useCollaborationStore((s) => s.setConnected);
  const setSynced = useCollaborationStore((s) => s.setSynced);
  const setCollaborators = useCollaborationStore((s) => s.setCollaborators);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let cleanupFn: (() => void) | undefined;
    canEditRef.current = true;
    cursorsRef.current.clear();

    const init = async () => {
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userName = currentUser.displayName || `User-${currentUser.uid.slice(0, 6)}`;
      const userColor = `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`;

      if (cancelled) return;

      const { doc, provider, awareness } = createCollaborationProvider(designId, () =>
        auth.currentUser ? auth.currentUser.getIdToken() : Promise.resolve(""),
      );

      providerRef.current = provider;
      docRef.current = doc;
      initialSyncDoneRef.current = false;

      if (generation === 0) {
        useEditorStore.setState({
          walls: [],
          openings: [],
          rooms: [],
          furniture: [],
          past: [],
          future: [],
          selectedElementId: null,
        });
      }

      const maps = new Map<CollectionKey, Y.Map<unknown>>();
      for (const key of COLLECTION_KEYS) maps.set(key, doc.getMap(key));

      const metaMap = doc.getMap(META_KEY);
      const readMeta = () => {
        const name = (metaMap.get("name") as string) || "Untitled Design";
        const ownerUid = metaMap.get("ownerUid") as string;
        setDesignMeta({ name, isOwner: ownerUid === currentUser.uid, canEdit: canEditRef.current });
      };

      const metaHandler = () => readMeta();
      metaMap.observe(metaHandler);
      const observerHandlers: Array<() => void> = [() => metaMap.unobserve(metaHandler)];

      for (const key of COLLECTION_KEYS) {
        const yMap = maps.get(key)!;
        const handler = (_event: Y.YMapEvent<unknown>, transaction: Y.Transaction) => {
          if (!initialSyncDoneRef.current) return;
          if (transaction.origin === LOCAL_ORIGIN) return;
          isRemoteUpdateRef.current = true;
          useEditorStore.setState({ [key]: yMapToArray(yMap) } as never);
          isRemoteUpdateRef.current = false;
        };
        yMap.observe(handler);
        observerHandlers.push(() => yMap.unobserve(handler));
      }

      const unsubEditor = useEditorStore.subscribe((state, prevState) => {
        if (isRemoteUpdateRef.current) return;
        if (!initialSyncDoneRef.current) return;
        for (const key of COLLECTION_KEYS) {
          if (state[key] !== prevState[key]) {
            syncArrayToYMap(doc, maps.get(key)!, state[key] as HasId[], prevState[key] as HasId[]);
          }
        }
      });

      provider.on("status", ({ status }: { status: string }) => {
        setConnected(status === "connected");
        if (status === "disconnected" && initialSyncDoneRef.current) setGeneration((g) => g + 1);
      });

      provider.on("authenticated", () => {
        canEditRef.current = provider.authorizedScope !== "readonly";
        setError(null);
        readMeta();
      });

      provider.on("authenticationFailed", ({ reason }: { reason: string }) => {
        setError(reason || "Access denied");
      });

      provider.on("synced", ({ state }: { state: boolean }) => {
        setSynced(state);
        if (state) setHasSyncedOnce(true);

        if (state && !initialSyncDoneRef.current) {
          initialSyncDoneRef.current = true;
          readMeta();

          const hasRemoteData = COLLECTION_KEYS.some((key) => maps.get(key)!.size > 0);
          if (hasRemoteData) {
            isRemoteUpdateRef.current = true;
            useEditorStore.setState(readAll(maps));
            isRemoteUpdateRef.current = false;
          } else {
            const store = useEditorStore.getState();
            for (const key of COLLECTION_KEYS) {
              syncArrayToYMap(doc, maps.get(key)!, store[key] as HasId[]);
            }
          }
        }
      });

      if (awareness) {
        awareness.setLocalStateField("user", { name: userName, color: userColor });

        const awarenessHandler = () => {
          const states = awareness.getStates();
          const localId = awareness.clientID;
          const seen = cursorsRef.current;
          const now = Date.now();
          const activeIds = new Set<number>();

          states.forEach((state: unknown, clientId: number) => {
            if (clientId === localId) return;
            const typed = state as AwarenessUserState;
            if (!typed.user) return;
            activeIds.add(clientId);
            const x = typed.cursor?.x ?? 0;
            const y = typed.cursor?.y ?? 0;
            const prev = seen.get(clientId);
            const moved = !prev || prev.x !== x || prev.y !== y;
            seen.set(clientId, {
              id: String(clientId),
              name: typed.user.name,
              color: typed.user.color,
              x,
              y,
              lastSeen: moved ? now : (prev?.lastSeen ?? now),
            });
          });

          for (const clientId of seen.keys()) if (!activeIds.has(clientId)) seen.delete(clientId);
          setCollaborators(Array.from(seen.values()));
        };

        awareness.on("change", awarenessHandler);
        observerHandlers.push(() => awareness.off("change", awarenessHandler));
      }

      cleanupFn = () => {
        for (const cleanup of observerHandlers) cleanup();
        unsubEditor();
        destroyProvider(provider);
        providerRef.current = null;
        docRef.current = null;
        initialSyncDoneRef.current = false;
        setConnected(false);
        setSynced(false);
        setCollaborators([]);
      };
    };

    init();

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, [designId, enabled, generation, setConnected, setSynced, setCollaborators]);

  const lastCursorBroadcastRef = useRef(0);
  const cursorFlushRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const broadcastCursor = useCallback((x: number, y: number) => {
    const provider = providerRef.current;
    if (!provider?.awareness) return;

    const now = Date.now();
    const elapsed = now - lastCursorBroadcastRef.current;
    if (elapsed < 40) {
      if (cursorFlushRef.current) clearTimeout(cursorFlushRef.current);
      cursorFlushRef.current = setTimeout(() => {
        lastCursorBroadcastRef.current = Date.now();
        providerRef.current?.awareness?.setLocalStateField("cursor", { x, y });
      }, 40 - elapsed);
      return;
    }
    lastCursorBroadcastRef.current = now;
    provider.awareness.setLocalStateField("cursor", { x, y });
  }, []);

  const updateDesignName = useCallback((name: string) => {
    docRef.current?.getMap(META_KEY).set("name", name);
  }, []);

  return {
    isConnected,
    isSynced,
    hasSyncedOnce,
    broadcastCursor,
    designMeta,
    updateDesignName,
    error,
  };
};
