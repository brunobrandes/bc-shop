"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  CallInsight,
  CallInsightsOverview,
  CallInsightsPage,
} from "@/lib/call-insights/contracts";
import { useAdminAuth } from "./admin-auth";
import {
  AdminHeader,
  AdminLoading,
  AdminLogin,
  AdminUnauthorized,
} from "./admin-shell";
import { DashboardView } from "./call-insights-view";

type State = "loading" | "ready" | "unauthorized" | "error";

async function authenticatedJson<T>(url: string, token: string) {
  const response = await fetch(url, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (response.status === 403) throw new Error("FORBIDDEN");
  if (!response.ok) throw new Error("REQUEST_FAILED");
  return (await response.json()) as T;
}

export function DashboardClient() {
  const auth = useAdminAuth();
  const [range, setRange] = useState<"7d" | "30d">("30d");
  const [state, setState] = useState<State>("loading");
  const [overview, setOverview] = useState<CallInsightsOverview>();
  const [calls, setCalls] = useState<CallInsight[]>([]);
  const [cursor, setCursor] = useState<string>();

  const load = useCallback(async () => {
    const token = await auth.token();
    if (!token) return;
    setState("loading");
    try {
      const [nextOverview, page] = await Promise.all([
        authenticatedJson<CallInsightsOverview>(
          `/api/admin/call-insights/overview?range=${range}`,
          token,
        ),
        authenticatedJson<CallInsightsPage>(
          `/api/admin/call-insights/calls?range=${range}&limit=25`,
          token,
        ),
      ]);
      setOverview(nextOverview);
      setCalls(page.calls);
      setCursor(page.nextCursor);
      setState("ready");
    } catch (error) {
      setState(
        error instanceof Error && error.message === "FORBIDDEN"
          ? "unauthorized"
          : "error",
      );
    }
  }, [auth, range]);

  useEffect(() => {
    if (!auth.user) return;
    const timeout = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeout);
  }, [auth.user, load]);

  async function loadMore() {
    if (!cursor) return;
    const token = await auth.token();
    if (!token) return;
    try {
      const page = await authenticatedJson<CallInsightsPage>(
        `/api/admin/call-insights/calls?range=${range}&limit=25&cursor=${encodeURIComponent(cursor)}`,
        token,
      );
      setCalls((current) => [...current, ...page.calls]);
      setCursor(page.nextCursor);
    } catch {
      setState("error");
    }
  }

  if (auth.loading) return <AdminLoading />;
  if (!auth.user) return <AdminLogin />;
  if (state === "unauthorized") return <AdminUnauthorized />;
  return (
    <div className="admin-app">
      <AdminHeader />
      {state === "loading" && <AdminLoading />}
      {state === "error" && (
        <main className="admin-state">
          <h1>CallInsights could not be loaded</h1>
          <p>Check the service configuration and try again.</p>
          <button className="admin-secondary-button" onClick={() => load()}>
            Try again
          </button>
        </main>
      )}
      {state === "ready" && overview && (
        <DashboardView
          overview={overview}
          calls={calls}
          range={range}
          onRangeChange={(nextRange) => {
            setState("loading");
            setRange(nextRange);
          }}
          onLoadMore={loadMore}
          hasMore={Boolean(cursor)}
        />
      )}
    </div>
  );
}
