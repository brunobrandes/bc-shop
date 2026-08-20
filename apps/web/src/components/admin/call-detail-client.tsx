"use client";

import { useEffect, useState } from "react";
import type { CallInsightDetail } from "@/lib/call-insights/contracts";
import { useAdminAuth } from "./admin-auth";
import {
  AdminHeader,
  AdminLoading,
  AdminLogin,
  AdminUnauthorized,
} from "./admin-shell";
import { CallDetailView } from "./call-insights-view";

export function CallDetailClient({ callId }: { callId: string }) {
  const auth = useAdminAuth();
  const [call, setCall] = useState<CallInsightDetail>();
  const [status, setStatus] = useState<
    "loading" | "ready" | "unauthorized" | "missing" | "error"
  >("loading");

  useEffect(() => {
    if (!auth.user) return;
    void (async () => {
      const token = await auth.token();
      if (!token) return;
      try {
        const response = await fetch(
          `/api/admin/call-insights/calls/${encodeURIComponent(callId)}`,
          { headers: { authorization: `Bearer ${token}` } },
        );
        if (response.status === 403) return setStatus("unauthorized");
        if (response.status === 404) return setStatus("missing");
        if (!response.ok) throw new Error("Request failed");
        setCall((await response.json()) as CallInsightDetail);
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    })();
  }, [auth, callId]);

  if (auth.loading) return <AdminLoading />;
  if (!auth.user) return <AdminLogin />;
  if (status === "unauthorized") return <AdminUnauthorized />;
  return (
    <div className="admin-app">
      <AdminHeader />
      {status === "loading" && <AdminLoading />}
      {status === "ready" && call && <CallDetailView call={call} />}
      {(status === "missing" || status === "error") && (
        <main className="admin-state">
          <h1>
            {status === "missing" ? "Call not found" : "Unable to load call"}
          </h1>
          <p>
            {status === "missing"
              ? "This call is not available in the selected environment."
              : "The CallInsights service is temporarily unavailable."}
          </p>
        </main>
      )}
    </div>
  );
}
