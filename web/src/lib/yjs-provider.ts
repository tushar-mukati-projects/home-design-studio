import { HocuspocusProvider, HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import * as Y from "yjs";

import { WS_URL } from "@/lib/env";
import { collabDocumentName } from "@/shared/canvas";

const RECONNECT_MAX_ATTEMPTS = 20;
const RECONNECT_MAX_DELAY_MS = 30_000;

type TokenGetter = () => Promise<string>;

export const createCollaborationProvider = (
  designId: string,
  getToken: TokenGetter,
): HocuspocusProvider =>
  new HocuspocusProvider({
    name: collabDocumentName(designId),
    document: new Y.Doc(),
    token: getToken,
    websocketProvider: new HocuspocusProviderWebsocket({
      url: WS_URL,
      maxAttempts: RECONNECT_MAX_ATTEMPTS,
      maxDelay: RECONNECT_MAX_DELAY_MS,
    }),
  });

export const destroyProvider = (provider: HocuspocusProvider): void => {
  provider.destroy();
  provider.configuration.websocketProvider.destroy();
};
