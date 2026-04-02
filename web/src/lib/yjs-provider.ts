import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";

const getWsUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const base = apiUrl.replace(/\/api\/?$/, "");
  const wsBase = base.replace(/^http/, "ws");
  return `${wsBase}/collaboration`;
};

interface CollaborationProvider {
  doc: Y.Doc;
  provider: HocuspocusProvider;
  awareness: HocuspocusProvider["awareness"];
}

export const createCollaborationProvider = (
  designId: string,
  userName: string,
  userColor: string,
  token?: string,
): CollaborationProvider => {
  const doc = new Y.Doc();

  const provider = new HocuspocusProvider({
    url: getWsUrl(),
    name: `design:${designId}`,
    document: doc,
    token: token ?? null,
  });

  if (provider.awareness) {
    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });
  }

  return { doc, provider, awareness: provider.awareness };
};

export const destroyProvider = (provider: HocuspocusProvider): void => {
  provider.disconnect();
  provider.destroy();
};
