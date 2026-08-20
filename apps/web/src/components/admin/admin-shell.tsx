"use client";

import Link from "next/link";
import { useAdminAuth } from "./admin-auth";

export function AdminLogin({ error }: { error?: string }) {
  const auth = useAdminAuth();
  return (
    <main className="admin-login">
      <section className="admin-login__card">
        <div className="admin-brand">
          <span>BC</span>
          <strong>BC-Shop</strong>
        </div>
        <p className="admin-kicker">CALLINSIGHTS</p>
        <h1>Every customer conversation, clearly understood.</h1>
        <p>
          Understand what customers are asking, how calls are performing, and
          what happened in every conversation.
        </p>
        {(error || auth.error) && (
          <div className="admin-alert admin-alert--error" role="alert">
            {error || auth.error}
          </div>
        )}
        <button className="admin-google-button" onClick={() => auth.signIn()}>
          <span>G</span> Continue with Google
        </button>
      </section>
    </main>
  );
}

export function AdminHeader() {
  const { user, signOut } = useAdminAuth();
  return (
    <AdminHeaderView
      name={user?.displayName || "Administrator"}
      email={user?.email || undefined}
      onSignOut={() => signOut()}
    />
  );
}

export function AdminHeaderView({
  name,
  email,
  onSignOut,
}: {
  name: string;
  email?: string;
  onSignOut?: () => void;
}) {
  return (
    <header className="admin-header">
      <div className="admin-header__inner">
        <Link className="admin-brand" href="/admin">
          <span>BC</span>
          <strong>BC-Shop</strong>
        </Link>
        <div className="admin-header__title">CallInsights</div>
        <div className="admin-identity">
          <div>
            <strong>{name}</strong>
            <small>{email}</small>
          </div>
          <button onClick={onSignOut}>Sign out</button>
        </div>
      </div>
    </header>
  );
}

export function AdminLoading() {
  return (
    <main className="admin-state" aria-live="polite">
      <div className="admin-spinner" />
      <p>Loading CallInsights…</p>
    </main>
  );
}

export function AdminUnauthorized() {
  const { signOut } = useAdminAuth();
  return (
    <main className="admin-state">
      <div className="admin-state__icon">!</div>
      <h1>Access unavailable</h1>
      <p>You do not have access to BC-Shop CallInsights.</p>
      <button className="admin-secondary-button" onClick={() => signOut()}>
        Sign out
      </button>
    </main>
  );
}
