export type AuthInfo = {
  userId: string;
  authSub: string;
  email?: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthInfo;
    }
  }
}
