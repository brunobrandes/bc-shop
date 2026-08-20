import { describe, expect, it } from "vitest";
import { createAdminProxyHandler } from "./admin-proxy";

const request = new Request("https://example.test/api/admin/call-insights");

describe("CallInsights admin proxy", () => {
  it("does not call Azure for unauthenticated requests", async () => {
    let called = false;
    const handler = createAdminProxyHandler(
      () => "overview",
      async () => ({ ok: false, status: 401 }),
      async () => {
        called = true;
        return { status: 200, body: {} };
      },
    );
    expect((await handler(request)).status).toBe(401);
    expect(called).toBe(false);
  });

  it("returns 403 for authenticated unauthorized users", async () => {
    const handler = createAdminProxyHandler(
      () => "overview",
      async () => ({ ok: false, status: 403 }),
    );
    const response = await handler(request);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "You do not have access to BC-Shop CallInsights.",
    });
  });

  it("proxies authorized requests without exposing the admin key", async () => {
    const handler = createAdminProxyHandler(
      () => "overview?range=30d",
      async () => ({ ok: true, email: "admin@example.com" }),
      async (path) => ({
        status: 200,
        body: { path, totalCalls: 4 },
      }),
    );
    const response = await handler(request);
    const body = JSON.stringify(await response.json());
    expect(response.status).toBe(200);
    expect(body).toContain("totalCalls");
    expect(body).not.toContain("BC_ADMIN_API_KEY");
    expect(body).not.toContain("x-bc-admin-key");
  });

  it("returns a safe API error", async () => {
    const handler = createAdminProxyHandler(
      () => "overview",
      async () => ({ ok: true, email: "admin@example.com" }),
      async () => {
        throw new Error("secret backend detail");
      },
    );
    const response = await handler(request);
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain(
      "secret backend detail",
    );
  });
});
