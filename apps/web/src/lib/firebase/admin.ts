import "server-only";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export type VerifiedAdminToken = {
  email?: string;
  email_verified?: boolean;
  name?: string;
};

export type AdminAuthorization =
  { ok: true; email: string; name?: string } | { ok: false; status: 401 | 403 };

function adminEmails(value = process.env.ADMIN_EMAILS) {
  return new Set(
    (value || "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function authorizeAdminToken(
  authorization: string | null,
  verifyToken: (token: string) => Promise<VerifiedAdminToken>,
  allowlist = adminEmails(),
): Promise<AdminAuthorization> {
  if (!authorization?.startsWith("Bearer ")) return { ok: false, status: 401 };
  const token = authorization.slice(7).trim();
  if (!token) return { ok: false, status: 401 };

  let decoded: VerifiedAdminToken;
  try {
    decoded = await verifyToken(token);
  } catch {
    return { ok: false, status: 401 };
  }

  const email = decoded.email?.trim().toLowerCase();
  if (!email || decoded.email_verified !== true || !allowlist.has(email))
    return { ok: false, status: 403 };
  return { ok: true, email, ...(decoded.name ? { name: decoded.name } : {}) };
}

function firebaseAdminAuth() {
  const app =
    getApps()[0] || initializeApp({ credential: applicationDefault() });
  return getAuth(app);
}

export function authorizeAdminRequest(request: Request) {
  return authorizeAdminToken(request.headers.get("authorization"), (token) =>
    firebaseAdminAuth().verifyIdToken(token),
  );
}
