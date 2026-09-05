"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import { createCollaborationProvider, destroyProvider } from "@/lib/yjs-provider";
import { auth } from "@/lib/firebase";
import { useEditorStore } from "@/stores/editor-store";
import { useCollaborationStore, type CollaboratorCursor } from "@/stores/collaboration-store";
import type { Wall, Door, Window, Room, PlacedFurniture } from "@/types";

type CollectionKey = "walls" | "doors" | "windows" | "furniture" | "rooms";

interface HasId {
  id: string;
}

const LOCAL_ORIGIN = "local";

const syncArrayToYMap = <T extends HasId>(doc: Y.Doc, yMap: Y.Map<unknown>, items: T[]): void => {
  doc.transact(() => {
    const existingIds = new Set(yMap.keys());
    const newIds = new Set(items.map((i) => i.id));

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        yMap.delete(id);
      }
    }

    for (const item of items) {
      const existing = yMap.get(item.id);
      if (!existing || JSON.stringify(existing) !== JSON.stringify(item)) {
        yMap.set(item.id, structuredClone(item));
      }
    }
  }, LOCAL_ORIGIN);
};

const yMapToArray = <T extends HasId>(yMap: Y.Map<unknown>): T[] => {
  const result: T[] = [];
  yMap.forEach((value) => {
    result.push(value as T);
  });
  return result;
};

const COLLECTION_KEYS: CollectionKey[] = ["walls", "doors", "windows", "furniture", "rooms"];

interface AwarenessUserState {
  user?: {
    name: string;
    color: string;
    permission?: string;
  };
  cursor?: {
    x: number;
    y: number;
  };
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
  const unsubEditorRef = useRef<(() => void) | null>(null);
  const yMapsRef = useRef<Map<CollectionKey, Y.Map<unknown>>>(new Map());
  const initialSyncDoneRef = useRef(false);

  const [designMeta, setDesignMeta] = useState<DesignMeta>({
    name: "Untitled Design",
    isOwner: true,
    canEdit: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);
  const canEditRef = useRef(true);
  const cursorsRef = useRef<Map<number, CollaboratorCursor>>(new Map());

  const { isConnected, isSynced, collaborators } = useCollaborationStore();
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

      useEditorStore.setState({
        walls: [],
        doors: [],
        windows: [],
        furniture: [],
        rooms: [],
        past: [],
        future: [],
        selectedElementId: null,
      });

      const maps = new Map<CollectionKey, Y.Map<unknown>>();
      for (const key of COLLECTION_KEYS) {
        maps.set(key, doc.getMap(key));
      }
      yMapsRef.current = maps;

      const metaMap = doc.getMap("metadata");
      const readMeta = () => {
        const name = (metaMap.get("name") as string) || "Untitled Design";
        const ownerUid = metaMap.get("ownerUid") as string;
        const isOwner = ownerUid === currentUser.uid;
        setDesignMeta({ name, isOwner, canEdit: canEditRef.current });
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
          switch (key) {
            case "walls":
              useEditorStore.setState({ walls: yMapToArray<Wall>(yMap) });
              break;
            case "doors":
              useEditorStore.setState({ doors: yMapToArray<Door>(yMap) });
              break;
            case "windows":
              useEditorStore.setState({ windows: yMapToArray<Window>(yMap) });
              break;
            case "furniture":
              useEditorStore.setState({ furniture: yMapToArray<PlacedFurniture>(yMap) });
              break;
            case "rooms":
              useEditorStore.setState({ rooms: yMapToArray<Room>(yMap) });
              break;
          }

          isRemoteUpdateRef.current = false;
        };

        yMap.observe(handler);
        observerHandlers.push(() => yMap.unobserve(handler));
      }

      const unsubEditor = useEditorStore.subscribe((state, prevState) => {
        if (isRemoteUpdateRef.current) return;
        if (!initialSyncDoneRef.current) return;

        for (const key of COLLECTION_KEYS) {
          const yMap = maps.get(key)!;
          const current = state[key];
          const prev = prevState[key];

          if (current !== prev) {
            syncArrayToYMap(doc, yMap, current as HasId[]);
          }
        }
      });

      unsubEditorRef.current = unsubEditor;

      provider.on("status", ({ status }: { status: string }) => {
        setConnected(status === "connected");
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

          let hasRemoteData = false;
          for (const key of COLLECTION_KEYS) {
            const yMap = maps.get(key)!;
            if (yMap.size > 0) {
              hasRemoteData = true;
              break;
            }
          }

          if (hasRemoteData) {
            isRemoteUpdateRef.current = true;
            useEditorStore.setState({
              walls: yMapToArray<Wall>(maps.get("walls")!),
              doors: yMapToArray<Door>(maps.get("doors")!),
              windows: yMapToArray<Window>(maps.get("windows")!),
              furniture: yMapToArray<PlacedFurniture>(maps.get("furniture")!),
              rooms: yMapToArray<Room>(maps.get("rooms")!),
            });
            isRemoteUpdateRef.current = false;
          } else {
            const store = useEditorStore.getState();
            for (const key of COLLECTION_KEYS) {
              const yMap = maps.get(key)!;
              syncArrayToYMap(doc, yMap, store[key] as HasId[]);
            }
          }
        }
      });

      if (awareness) {
        awareness.setLocalStateField("user", {
          name: userName,
          color: userColor,
        });

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

          for (const clientId of seen.keys()) {
            if (!activeIds.has(clientId)) seen.delete(clientId);
          }

          setCollaborators(Array.from(seen.values()));
        };

        awareness.on("change", awarenessHandler);
        observerHandlers.push(() => awareness.off("change", awarenessHandler));
      }

      cleanupFn = () => {
        for (const cleanup of observerHandlers) {
          cleanup();
        }
        unsubEditor();
        unsubEditorRef.current = null;
        destroyProvider(provider);
        providerRef.current = null;
        docRef.current = null;
        yMapsRef.current.clear();
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
  }, [designId, enabled, setConnected, setSynced, setCollaborators]);

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
    const doc = docRef.current;
    if (!doc) return;
    doc.getMap("metadata").set("name", name);
  }, []);

  return {
    isConnected,
    isSynced,
    hasSyncedOnce,
    collaborators,
    broadcastCursor,
    designMeta,
    updateDesignName,
    error,
  };
};
