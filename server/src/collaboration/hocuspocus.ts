import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { getDesignPermission } from "../lib/design-access";
import { firebaseAuth } from "../lib/firebase-admin";
import { logger } from "../lib/logger";
import { extractCanvasFromDoc, buildYjsState, fillDocFromCanvas, META_KEY } from "./yjs-doc";
import type { Canvas } from "../schemas/canvas.schema";

const collabDocumentName = (designId: string) => `design:${designId}`;

const hocuspocus = new Hocuspocus({
  quiet: true,
  async onAuthenticate(data: {
    token: string;
    documentName: string;
    connection: { readOnly: boolean };
  }) {
    const { token, documentName } = data;
    if (!token) throw new Error("Authentication required");

    const decoded = await firebaseAuth.verifyIdToken(token);

    const user = await prisma.user.findUnique({ where: { authSub: decoded.uid } });
    if (!user) {
      logger.warn("Collab auth failed: user not found", { uid: decoded.uid });
      throw new Error("User not found");
    }

    const designId = documentName.replace(/^design:/, "");
    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, userId: true },
    });

    if (!design) throw new Error("Design not found");

    const email = decoded.email_verified && decoded.email ? decoded.email.toLowerCase() : undefined;
    const permission = await getDesignPermission(design, user.id, email);

    if (!permission) throw new Error("Access denied");
    if (permission === "readonly") data.connection.readOnly = true;

    logger.debug("Collab auth success", { userId: user.id });
    return {
      user: { id: user.id, authSub: decoded.uid },
      readOnly: data.connection.readOnly,
    };
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }: { documentName: string }) => {
        const designId = documentName.replace(/^design:/, "");
        if (!designId) return null;

        const design = await prisma.design.findUnique({
          where: { id: designId },
          select: { canvasData: true, name: true, user: { select: { authSub: true } } },
        });

        if (!design) return null;

        // The live document is rebuilt from canvas_data every time it is opened.
        const doc = new Y.Doc();
        Y.applyUpdate(doc, buildYjsState(design.canvasData as Partial<Canvas>));

        const meta = doc.getMap(META_KEY);
        doc.transact(() => {
          if (meta.get("name") !== design.name) meta.set("name", design.name);
          if (meta.get("ownerUid") !== design.user.authSub) {
            meta.set("ownerUid", design.user.authSub);
          }
        });

        const state = Y.encodeStateAsUpdate(doc);
        doc.destroy();
        return state;
      },
      store: async ({ documentName, state }: { documentName: string; state: Uint8Array }) => {
        const designId = documentName.replace(/^design:/, "");
        if (!designId) return;

        const doc = new Y.Doc();
        Y.applyUpdate(doc, state);
        const canvas = extractCanvasFromDoc(doc);
        const name = doc.getMap(META_KEY).get("name") as string | undefined;
        doc.destroy();

        const exists = await prisma.design.count({ where: { id: designId } });
        if (!exists) return;

        await prisma.design.update({
          where: { id: designId },
          data: {
            canvasData: canvas as unknown as Prisma.InputJsonValue,
            ...(name ? { name } : {}),
          },
        });
      },
    }),
  ],
});

// The write path for a design's canvas: an open document would otherwise flush its own
// stale copy over a direct column write.
export const applyToCollabDoc = async (
  designId: string,
  update: { canvas?: Canvas; name?: string },
): Promise<void> => {
  const documentName = collabDocumentName(designId);
  let connection: Awaited<ReturnType<typeof hocuspocus.openDirectConnection>> | null = null;

  try {
    connection = await hocuspocus.openDirectConnection(documentName);
    await connection.transact((doc) => {
      doc.transact(() => {
        if (update.canvas) fillDocFromCanvas(doc, update.canvas);
        if (update.name !== undefined) doc.getMap(META_KEY).set("name", update.name);
      });
    });
    logger.debug("Applied server-side change to collab doc", { designId });
  } catch (err) {
    logger.error("Failed to apply server-side change to collab doc", {
      designId,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err instanceof Error ? err : new Error("Collaboration update failed");
  } finally {
    await connection?.disconnect().catch(() => undefined);
  }
};

export const readCollabCanvas = async (designId: string): Promise<Canvas | null> => {
  const documentName = collabDocumentName(designId);
  const doc = hocuspocus.documents.get(documentName);
  return doc ? extractCanvasFromDoc(doc) : null;
};

export const startCollab = () => {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws, req) => {
    logger.debug("New collab WebSocket connection", { url: req.url });
    hocuspocus.handleConnection(ws, req);
  });
  return wss;
};
