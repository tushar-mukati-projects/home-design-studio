import {
  Hocuspocus,
  type fetchPayload,
  type onAuthenticatePayload,
  type storePayload,
} from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { WebSocketServer } from "ws";
import { prisma } from "../lib/db";
import { getDesignPermission } from "../lib/design-access";
import { firebaseAuth, verifiedEmailOf } from "../lib/firebase-admin";
import { errorMessage } from "../lib/http-error";
import { logger } from "../lib/logger";
import {
  canvasFromRow,
  designFromState,
  extractCanvasFromDoc,
  fillDocFromCanvas,
  stateFromDesign,
} from "./yjs-doc";
import {
  COLLAB_META_KEY,
  collabDocumentName,
  designIdFromDocumentName,
  type Canvas,
} from "../shared/canvas";

const COLLAB_MAX_PAYLOAD_BYTES = 5 * 1024 * 1024;
const RESET_CONNECTION = { code: 4205, reason: "Reset Connection" };

type CollabChange = { canvas?: Canvas; name?: string };
type CollabContext = { userId: string; email: string | undefined };

const denied = (reason: string) => Object.assign(new Error(reason), { reason });

const designIdOf = (documentName: string): string => {
  const designId = designIdFromDocumentName(documentName);
  if (!designId) throw denied("Design not found");
  return designId;
};

const authenticate = async ({
  token,
  documentName,
  connection,
}: onAuthenticatePayload): Promise<CollabContext> => {
  if (!token) throw denied("Authentication required");

  const decoded = await firebaseAuth.verifyIdToken(token).catch((error: unknown) => {
    logger.warn("Collab token rejected", { error: errorMessage(error) });
    throw denied("Your session expired. Please refresh the page and sign in again.");
  });

  const user = await prisma.user.findUnique({ where: { authSub: decoded.uid } });
  if (!user) {
    logger.warn("Collab auth failed: user not found", { uid: decoded.uid });
    throw denied("User not found");
  }

  const design = await prisma.design.findUnique({
    where: { id: designIdOf(documentName) },
    select: { id: true, userId: true },
  });
  if (!design || documentName !== collabDocumentName(design.id)) throw denied("Design not found");

  const email = verifiedEmailOf(decoded);
  const permission = await getDesignPermission(design, user.id, email);
  if (!permission) throw denied("Access denied");
  if (permission === "readonly") connection.readOnly = true;

  logger.debug("Collab auth success", { userId: user.id });
  return { userId: user.id, email };
};

const loadDesign = async ({ documentName }: fetchPayload) => {
  const design = await prisma.design.findUnique({
    where: { id: designIdOf(documentName) },
    select: { canvasData: true, name: true, user: { select: { authSub: true } } },
  });
  if (!design) return null;
  return stateFromDesign({
    canvasData: design.canvasData,
    name: design.name,
    ownerUid: design.user.authSub,
  });
};

const saveDesign = async ({ documentName, state }: storePayload) => {
  const designId = designIdOf(documentName);
  const { canvas, name, dropped } = designFromState(state);
  if (Object.keys(dropped).length > 0 || name === null) {
    logger.warn("Invalid collab content dropped on save", {
      designId,
      dropped,
      nameDropped: name === null,
    });
  }
  await prisma.design.updateMany({
    where: { id: designId },
    data: { canvasData: canvas, ...(name === null ? {} : { name }) },
  });
};

const hocuspocus = new Hocuspocus({
  quiet: true,
  onAuthenticate: authenticate,
  extensions: [new Database({ fetch: loadDesign, store: saveDesign })],
});

export const applyToCollabDoc = async (designId: string, change: CollabChange): Promise<void> => {
  const connection = await hocuspocus.openDirectConnection(collabDocumentName(designId));
  try {
    await connection.transact((doc) => {
      doc.transact(() => {
        if (change.canvas) fillDocFromCanvas(doc, change.canvas);
        if (change.name !== undefined) doc.getMap(COLLAB_META_KEY).set("name", change.name);
      });
    });
  } finally {
    await connection.disconnect();
  }
};

export const currentCanvas = (designId: string, canvasData: unknown): Canvas => {
  const doc = hocuspocus.documents.get(collabDocumentName(designId));
  return doc ? extractCanvasFromDoc(doc) : canvasFromRow(canvasData);
};

export const closeCollabConnections = (designId: string): void =>
  hocuspocus.closeConnections(collabDocumentName(designId));

export const closeMemberConnections = (designId: string, email: string): void => {
  const connections = hocuspocus.documents.get(collabDocumentName(designId))?.getConnections();
  for (const connection of connections ?? []) {
    if ((connection.context as CollabContext).email === email) connection.close(RESET_CONNECTION);
  }
};

export const startCollab = () => {
  const wss = new WebSocketServer({ noServer: true, maxPayload: COLLAB_MAX_PAYLOAD_BYTES });
  wss.on("connection", (ws, req) => {
    logger.debug("New collab WebSocket connection", { url: req.url });
    hocuspocus.handleConnection(ws, req);
  });
  return wss;
};
