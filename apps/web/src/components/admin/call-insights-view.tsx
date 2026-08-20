import Link from "next/link";
import type {
  CallInsight,
  CallInsightDetail,
  CallInsightsOverview,
} from "@/lib/call-insights/contracts";

export function formatDuration(seconds?: number) {
  if (seconds === undefined) return "—";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return minutes ? `${minutes}m ${remaining}s` : `${remaining}s`;
}

export function formatCallDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function StatusBadge({ value }: { value?: string }) {
  const normalized = (value || "unknown").toLowerCase();
  return (
    <span className={`admin-status admin-status--${normalized}`}>
      {value || "Unknown"}
    </span>
  );
}

export function CallsList({ calls }: { calls: CallInsight[] }) {
  if (!calls.length)
    return (
      <div className="admin-empty">
        <h3>No calls in this period</h3>
        <p>Completed Atlas calls will appear here after ingestion.</p>
      </div>
    );

  return (
    <div className="admin-calls">
      <div className="admin-calls__head" aria-hidden="true">
        <span>Customer</span>
        <span>Status</span>
        <span>Duration</span>
        <span>Summary</span>
        <span>Date</span>
        <span>Processing</span>
      </div>
      {calls.map((call) => (
        <Link
          href={`/admin/calls/${encodeURIComponent(call.callId)}`}
          className="admin-call-row"
          key={call.callId}
        >
          <span data-label="Customer">
            <strong>{call.customerName || "Unknown customer"}</strong>
            <small>{call.callId}</small>
          </span>
          <span data-label="Status">
            <StatusBadge value={call.status} />
          </span>
          <span data-label="Duration">
            {formatDuration(call.durationSeconds)}
          </span>
          <span className="admin-call-summary" data-label="Summary">
            {call.callSummary || "No summary available"}
          </span>
          <span data-label="Date">
            {formatCallDate(call.startedAt || call.receivedAt)}
          </span>
          <span data-label="Processing">
            <StatusBadge value={call.processingStatus} />
          </span>
        </Link>
      ))}
    </div>
  );
}

export function DashboardView({
  overview,
  calls,
  range,
  onRangeChange,
  onLoadMore,
  hasMore,
}: {
  overview: CallInsightsOverview;
  calls: CallInsight[];
  range: "7d" | "30d";
  onRangeChange?: (range: "7d" | "30d") => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) {
  const metrics = [
    ["Total Calls", overview.totalCalls],
    ["Completed", overview.completedCalls],
    ["Failed", overview.failedCalls],
    ["Average Duration", formatDuration(overview.averageDurationSeconds)],
  ];
  return (
    <main className="admin-main">
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">OPERATIONS OVERVIEW</p>
          <h1>Customer calls</h1>
          <p>Factual call outcomes and ingestion health from Atlas.</p>
        </div>
        <label className="admin-range">
          <span>Period</span>
          <select
            aria-label="Call period"
            value={range}
            onChange={(event) =>
              onRangeChange?.(event.target.value as "7d" | "30d")
            }
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </label>
      </div>
      <section className="admin-kpis" aria-label="Call metrics">
        {metrics.map(([label, value]) => (
          <article className="admin-kpi" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>
      <section className="admin-panel">
        <div className="admin-panel__heading">
          <div>
            <h2>Call history</h2>
            <p>Open a call to review its summary and transcript.</p>
          </div>
          <span>{overview.totalCalls} calls</span>
        </div>
        <CallsList calls={calls} />
        {hasMore && (
          <button className="admin-load-more" onClick={onLoadMore}>
            Load more calls
          </button>
        )}
      </section>
    </main>
  );
}

export function CallDetailView({ call }: { call: CallInsightDetail }) {
  const fields = [
    ["Customer", call.customerName || "Unknown customer"],
    ["Call status", call.status || "Unknown"],
    ["Processing", call.processingStatus],
    ["Started", formatCallDate(call.startedAt)],
    ["Ended", formatCallDate(call.endedAt)],
    ["Duration", formatDuration(call.durationSeconds)],
    ["Ended reason", call.endedReason || "—"],
  ];
  return (
    <main className="admin-main admin-detail">
      <Link className="admin-back" href="/admin">
        ← Back to calls
      </Link>
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">CALL DETAIL</p>
          <h1>{call.customerName || "Unknown customer"}</h1>
          <p>{formatCallDate(call.startedAt || call.receivedAt)}</p>
        </div>
        <StatusBadge value={call.processingStatus} />
      </div>
      <section className="admin-detail-grid">
        {fields.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="admin-detail-columns">
        <article className="admin-panel admin-copy-panel">
          <p className="admin-kicker">AI SUMMARY</p>
          <h2>Conversation summary</h2>
          <p>{call.callSummary || "No summary was provided by Atlas."}</p>
        </article>
        {call.audioUrl && (
          <article className="admin-panel admin-copy-panel">
            <p className="admin-kicker">RECORDING</p>
            <h2>Call recording</h2>
            <audio controls preload="none" src={call.audioUrl}>
              <a href={call.audioUrl}>Open recording</a>
            </audio>
            <a href={call.audioUrl} target="_blank" rel="noreferrer">
              Open recording in a new tab
            </a>
          </article>
        )}
      </section>
      <section className="admin-panel admin-copy-panel">
        <p className="admin-kicker">TRANSCRIPT</p>
        <h2>Full conversation</h2>
        {call.transcript ? (
          <div className="admin-transcript">{call.transcript}</div>
        ) : (
          <p>No transcript is available for this call.</p>
        )}
      </section>
      <section className="admin-panel admin-technical">
        <h2>Technical metadata</h2>
        <dl>
          <div>
            <dt>Call ID</dt>
            <dd>{call.callId}</dd>
          </div>
          <div>
            <dt>Campaign ID</dt>
            <dd>{call.campaignId || "—"}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{formatCallDate(call.receivedAt)}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
