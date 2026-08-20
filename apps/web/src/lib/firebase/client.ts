"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

function required(value: string | undefined, name: string) {
  if (!value) throw new Error(`Missing Firebase client configuration: ${name}`);
  return value;
}

export function firebaseClientAuth() {
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: required(
          process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
          "NEXT_PUBLIC_FIREBASE_API_KEY",
        ),
        authDomain: required(
          process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
          "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
        ),
        projectId: required(
          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
        ),
        appId: required(
          process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          "NEXT_PUBLIC_FIREBASE_APP_ID",
        ),
      });
  return getAuth(app);
}

export const googleProvider = new GoogleAuthProvider();
