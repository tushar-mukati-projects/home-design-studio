"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  WebSocketStatus,
  type HocuspocusProvider,
  type onAwarenessChangeParameters,
  type onStatusParameters,
  type onSyncedParameters,
} from "@hocuspocus/provider";

import { DEFAULT_DESIGN_NAME } from "@/lib/constants";
import { auth } from "@/lib/firebase";
import { createCollaborationProvider, destroyProvider } from "@/lib/yjs-provider";
import { CANVAS_COLLECTIONS, COLLAB_META_KEY } from "@/shared/canvas";
import { useCollaborationStore } from "@/stores/collaboration-store";
import { useEditorStore } from "@/stores/editor-store";
import { adoptCollections, bindStoreToDoc, readDesignName } from "./bind-store-to-doc";
import { collaboratorsFromAwareness, memberName, pickCollaboratorColor } from "./collaborators";
import { throttleCursor, type CursorThrottle } from "./cursor-throttle";

const READONLY_SCOPE = "readonly";
const SYNC_TIMEOUT_MS = 20_000;

type DesignMeta = {
  name: string;
  canEdit: boolean;
};

export type OpenFailure = "denied" | "timeout";

type Failure = {
  designId: string;
  kind: OpenFailure;
};

type Session = {
  provider: HocuspocusProvider;
  cursor: CursorThrottle;
};

type MetaWatch = {
  read: () => void;
  stop: () => void;
};

type Member = {
  name: string;
  color: string;
};

export const useCollaboration = (designId: string, enabled: boolean) => {
  const sessionRef = useRef<Session | null>(null);
  const [color] = useState(pickCollaboratorColor);
  const [generation, setGeneration] = useState(0);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [designMeta, setDesignMeta] = useState<DesignMeta>({
    name: DEFAULT_DESIGN_NAME,
    canEdit: true,
  });
  const isConnected = useCollaborationStore((s) => s.isConnected);
  const isSynced = useCollaborationStore((s) => s.isSynced);

  useEffect(() => {
    if (!enabled) return;
    const user = auth.currentUser;
    if (!user) return;
    const { setConnected, setSynced, reset } = useCollaborationStore.getState();
    const provider = createCollaborationProvider(designId, () => user.getIdToken());
    const cursor = throttleCursor((x, y) => provider.setAwarenessField("cursor", { x, y }));
    const meta = watchDesignMeta(provider, setDesignMeta);
    let unbindStore: (() => void) | null = null;
    let syncTimer: ReturnType<typeof setTimeout> | undefined;
    sessionRef.current = { provider, cursor };
    if (generation === 0) {
      adoptCollections(provider.document, CANVAS_COLLECTIONS);
      useEditorStore.getState().clearSelection();
      syncTimer = setTimeout(
        () => setFailure((current) => current ?? { designId, kind: "timeout" }),
        SYNC_TIMEOUT_MS,
      );
    }
    trackCollaborators(provider, { name: memberName(user.displayName, user.uid), color });
    provider.on("status", ({ status }: onStatusParameters) => {
      setConnected(status === WebSocketStatus.Connected);
      if (status === WebSocketStatus.Disconnected && unbindStore) setGeneration((g) => g + 1);
    });
    provider.on("authenticated", () => {
      setFailure(null);
      meta.read();
    });
    provider.on("authenticationFailed", () => setFailure({ designId, kind: "denied" }));
    provider.on("synced", ({ state }: onSyncedParameters) => {
      setSynced(state);
      if (!state || unbindStore) return;
      clearTimeout(syncTimer);
      unbindStore = bindStoreToDoc(provider.document);
      meta.read();
      setHasSyncedOnce(true);
    });
    return () => {
      clearTimeout(syncTimer);
      meta.stop();
      unbindStore?.();
      cursor.stop();
      destroyProvider(provider);
      sessionRef.current = null;
      reset();
    };
  }, [designId, enabled, generation, color]);

  const broadcastCursor = useCallback((x: number, y: number) => {
    sessionRef.current?.cursor.move(x, y);
  }, []);

  const updateDesignName = useCallback((name: string) => {
    sessionRef.current?.provider.document.getMap(COLLAB_META_KEY).set("name", name);
  }, []);

  return {
    isConnected,
    isSynced,
    hasSyncedOnce,
    broadcastCursor,
    designMeta,
    updateDesignName,
    failure: failure?.designId === designId ? failure.kind : null,
  };
};

const watchDesignMeta = (
  provider: HocuspocusProvider,
  onMeta: (meta: DesignMeta) => void,
): MetaWatch => {
  const metaMap = provider.document.getMap<unknown>(COLLAB_META_KEY);
  const read = () =>
    onMeta({
      name: readDesignName(provider.document),
      canEdit: provider.authorizedScope !== READONLY_SCOPE,
    });
  metaMap.observe(read);
  return { read, stop: () => metaMap.unobserve(read) };
};

const trackCollaborators = (provider: HocuspocusProvider, member: Member): void => {
  provider.setAwarenessField("user", member);
  provider.on("awarenessChange", ({ states }: onAwarenessChangeParameters) => {
    const { collaborators, setCollaborators } = useCollaborationStore.getState();
    const localClientId = provider.document.clientID;
    setCollaborators(collaboratorsFromAwareness(states, localClientId, collaborators, Date.now()));
  });
};
