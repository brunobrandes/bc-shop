import { createAdminProxyHandler } from "@/lib/call-insights/admin-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ callId: string }> },
) {
  const { callId } = await context.params;
  return createAdminProxyHandler(() => `calls/${encodeURIComponent(callId)}`)(
    request,
  );
}
