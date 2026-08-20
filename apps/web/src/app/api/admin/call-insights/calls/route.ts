import { createAdminProxyHandler } from "@/lib/call-insights/admin-proxy";

export const GET = createAdminProxyHandler((request) => {
  const input = new URL(request.url).searchParams;
  const output = new URLSearchParams({
    range: input.get("range") || "30d",
    limit: input.get("limit") || "25",
  });
  const cursor = input.get("cursor");
  if (cursor) output.set("cursor", cursor);
  return `calls?${output}`;
});
