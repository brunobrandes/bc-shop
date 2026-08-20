"use client";

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { firebaseClientAuth, googleProvider } from "@/lib/firebase/client";

type AdminAuthValue = {
  user: User | null;
  loading: boolean;
  error?: string;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  token: () => Promise<string | undefined>;
};

const AdminAuthContext = createContext<AdminAuthValue | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    try {
      return onAuthStateChanged(
        firebaseClientAuth(),
        (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        },
        () => {
          setError("Authentication is temporarily unavailable.");
          setLoading(false);
        },
      );
    } catch {
      queueMicrotask(() => {
        setError("Firebase Authentication is not configured.");
        setLoading(false);
      });
    }
  }, []);

  const value = useMemo<AdminAuthValue>(
    () => ({
      user,
      loading,
      error,
      async signIn() {
        setError(undefined);
        try {
          await signInWithPopup(firebaseClientAuth(), googleProvider);
        } catch {
          setError("Google Sign-In was not completed.");
        }
      },
      async signOut() {
        await firebaseSignOut(firebaseClientAuth());
      },
      async token() {
        return user?.getIdToken();
      },
    }),
    [error, loading, user],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("AdminAuthProvider is missing");
  return value;
}
