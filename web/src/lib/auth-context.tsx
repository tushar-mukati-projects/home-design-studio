"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";
import { clearJwtCache } from "./axios";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  signOut: async () => {},
  getIdToken: async () => "",
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
  }, []);

  const handleSignInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const handleSignInWithGithub = useCallback(async () => {
    await signInWithPopup(auth, new GithubAuthProvider());
  }, []);

  const handleSignOut = useCallback(async () => {
    await firebaseSignOut(auth);
    clearJwtCache();
  }, []);

  const getIdToken = useCallback(async () => {
    if (!user) return "";
    return user.getIdToken();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle: handleSignInWithGoogle,
        signInWithGithub: handleSignInWithGithub,
        signOut: handleSignOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
