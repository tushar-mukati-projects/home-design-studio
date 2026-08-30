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
  token: string | (() => Promise<string>),
): CollaborationProvider => {
  const doc = new Y.Doc();

  const provider = new HocuspocusProvider({
    url: getWsUrl(),
    name: `design:${designId}`,
    document: doc,
    token,
  });

  return { doc, provider, awareness: provider.awareness };
};

export const destroyProvider = (provider: HocuspocusProvider): void => {
  provider.disconnect();
  provider.destroy();
};
