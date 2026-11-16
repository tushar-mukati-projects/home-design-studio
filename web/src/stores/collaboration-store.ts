import { create } from "zustand";

export type Collaborator = {
  id: number;
  name: string;
  color: string;
  x: number;
  y: number;
  lastSeen: number;
};

type CollaborationState = {
  isConnected: boolean;
  isSynced: boolean;
  collaborators: Collaborator[];
  setConnected: (isConnected: boolean) => void;
  setSynced: (isSynced: boolean) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  reset: () => void;
};

export const useCollaborationStore = create<CollaborationState>()((set) => ({
  isConnected: false,
  isSynced: false,
  collaborators: [],
  setConnected: (isConnected) => set({ isConnected }),
  setSynced: (isSynced) => set({ isSynced }),
  setCollaborators: (collaborators) => set({ collaborators }),
  reset: () => set({ isConnected: false, isSynced: false, collaborators: [] }),
}));
