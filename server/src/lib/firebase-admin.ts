import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { config } from "./config";
import { httpError } from "./http-error";
import type { Auth, DecodedIdToken } from "firebase-admin/auth";

const auth = (): Auth => {
  if (!config.firebase) throw httpError(503, "AUTH_NOT_CONFIGURED");
  return getAuth(getApps()[0] ?? initializeApp({ credential: cert(config.firebase) }));
};

export const firebaseAuth = {
  verifyIdToken: (token: string) => auth().verifyIdToken(token),
};

export const verifiedEmailOf = (token: DecodedIdToken): string | undefined =>
  token.email_verified && token.email ? token.email.toLowerCase() : undefined;
