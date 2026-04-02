import { create } from "zustand";

export interface CollaboratorCursor {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface CollaborationState {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: CollaboratorCursor[];

  setConnected: (connected: boolean) => void;
  setSynced: (synced: boolean) => void;
  setCollaborators: (collaborators: CollaboratorCursor[]) => void;
  updateCursorPosition: (id: string, x: number, y: number) => void;
}

export const useCollaborationStore = create<CollaborationState>()((set) => ({
  isConnected: false,
  isSynced: false,
  collaborators: [],

  setConnected: (connected) => set({ isConnected: connected }),

  setSynced: (synced) => set({ isSynced: synced }),

  setCollaborators: (collaborators) => set({ collaborators }),

  updateCursorPosition: (id, x, y) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === id ? { ...c, x, y, lastSeen: Date.now() } : c,
      ),
    })),
}));
