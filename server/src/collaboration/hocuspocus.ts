import { Hocuspocus } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { WebSocketServer } from "ws";
import * as Y from "yjs";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { logger } from "../logger";
import { createVersion } from "../services/version.service";

const extractCanvasFromDoc = (doc: Y.Doc) => {
  const toArray = (yMap: Y.Map<unknown>) => {
    const arr: Record<string, unknown>[] = [];
    yMap.forEach((v) => arr.push(v as Record<string, unknown>));
    return arr;
  };

  return {
    walls: toArray(doc.getMap("walls")),
    doors: toArray(doc.getMap("doors")),
    windows: toArray(doc.getMap("windows")),
    furniture: toArray(doc.getMap("furniture")),
    rooms: toArray(doc.getMap("rooms")),
  };
};

const hocuspocus = new Hocuspocus({
  quiet: true,
  async onAuthenticate(data: { token: string }) {
    const { token } = data;
    if (!token) throw new Error("Authentication required");

    const user = await prisma.user.findUnique({
      where: { clerkId: token },
    });

    if (!user) {
      logger.warn("Collab auth failed: user not found", { token });
      throw new Error("User not found");
    }

    logger.debug("Collab auth success", { userId: user.id });
    return { user: { id: user.id, firebaseUid: token } };
  },
  extensions: [
    new Database({
      fetch: async ({ documentName }: { documentName: string }) => {
        const designId = documentName.replace(/^design:/, "");
        if (!designId) return null;

        const design = await prisma.design.findUnique({
          where: { id: designId },
          select: { yjsState: true },
        });

        return design?.yjsState ? new Uint8Array(design.yjsState) : null;
      },
      store: async ({ documentName, state }: { documentName: string; state: Uint8Array }) => {
        const designId = documentName.replace(/^design:/, "");
        if (!designId) return;

        const doc = new Y.Doc();
        Y.applyUpdate(doc, state);
        const canvasData = extractCanvasFromDoc(doc);
        doc.destroy();

        const design = await prisma.design.update({
          where: { id: designId },
          data: {
            yjsState: Buffer.from(state),
            canvasData: canvasData as unknown as Prisma.InputJsonValue,
          },
        });

        createVersion(designId, design.userId).catch((err) => {
          logger.error("Failed to auto-create version", {
            designId,
            error: err instanceof Error ? err.message : String(err),
          });
        });
      },
    }),
  ],
});

export const startCollab = () => {
  const wss = new WebSocketServer({ noServer: true });
  wss.on("connection", (ws, req) => {
    logger.debug("New collab WebSocket connection", { url: req.url });
    hocuspocus.handleConnection(ws, req);
  });
  return wss;
};
