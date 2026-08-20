import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  CallInsight,
  CallInsightDetail,
} from "@/lib/call-insights/contracts";
import { AdminHeaderView } from "./admin-shell";
import { CallDetailView, CallsList, DashboardView } from "./call-insights-view";

const call: CallInsight = {
  callId: "call-001",
  customerName: "Taylor Reed",
  status: "completed",
  durationSeconds: 94,
  callSummary: "Asked about a computer for design work.",
  receivedAt: "2026-08-20T15:00:00.000Z",
  processingStatus: "completed",
  hasTranscript: true,
};

describe("CallInsights views", () => {
  it("renders overview metrics and calls", () => {
    const html = renderToStaticMarkup(
      <DashboardView
        overview={{
          totalCalls: 4,
          completedCalls: 3,
          failedCalls: 1,
          averageDurationSeconds: 94,
          recentCalls: [call],
        }}
        calls={[call]}
        range="30d"
      />,
    );
    expect(html).toContain("Total Calls");
    expect(html).toContain("Taylor Reed");
    expect(html).toContain("1m 34s");
    expect(html).toContain("Call history");
  });

  it("renders the empty state", () => {
    const html = renderToStaticMarkup(<CallsList calls={[]} />);
    expect(html).toContain("No calls in this period");
  });

  it("renders call detail, transcript, recording, and safe metadata", () => {
    const detail: CallInsightDetail = {
      ...call,
      campaignId: "campaign-01",
      transcript: "Agent: How can I help?\nCustomer: I need a workstation.",
      audioUrl: "https://audio.example.test/call-001.mp3",
    };
    const html = renderToStaticMarkup(<CallDetailView call={detail} />);
    expect(html).toContain("Conversation summary");
    expect(html).toContain("Customer: I need a workstation.");
    expect(html).toContain("Call recording");
    expect(html).toContain("campaign-01");
    expect(html).not.toContain("AccountKey");
    expect(html).not.toContain("partitionKey");
  });

  it("renders the signed-in identity and sign-out action", () => {
    const html = renderToStaticMarkup(
      <AdminHeaderView name="Admin User" email="admin@example.com" />,
    );
    expect(html).toContain("admin@example.com");
    expect(html).toContain("Sign out");
  });
});
