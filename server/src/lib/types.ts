import type { Request } from "express";

export interface AuthInfo {
  userId: string;
  authSub: string;
  email?: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthInfo;
}
