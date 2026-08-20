import "server-only";

function config() {
  const baseUrl = process.env.CALL_INSIGHTS_API_BASE_URL?.replace(/\/$/, "");
  const key = process.env.BC_ADMIN_API_KEY;
  if (!baseUrl || !key) throw new Error("CallInsights API is not configured");
  return { baseUrl, key };
}

export async function callInsightsRequest(path: string) {
  const { baseUrl, key } = config();
  const response = await fetch(`${baseUrl}/${path.replace(/^\//, "")}`, {
    headers: { "x-bc-admin-key": key },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await response
    .json()
    .catch(() => ({ error: "Invalid response" }));
  return { status: response.status, body };
}
