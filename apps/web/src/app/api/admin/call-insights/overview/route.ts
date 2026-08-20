import { createAdminProxyHandler } from "@/lib/call-insights/admin-proxy";

export const GET = createAdminProxyHandler((request) => {
  const range = new URL(request.url).searchParams.get("range") || "30d";
  return `overview?range=${encodeURIComponent(range)}`;
});
