import { describe, expect, it } from "vitest";
import { authorizeAdminToken } from "./admin";

const allowlist = new Set(["admin@example.com"]);

describe("admin authorization", () => {
  it("rejects unauthenticated access", async () => {
    expect(
      await authorizeAdminToken(null, async () => ({}), allowlist),
    ).toEqual({ ok: false, status: 401 });
  });

  it("accepts an authenticated allowlisted admin", async () => {
    expect(
      await authorizeAdminToken(
        "Bearer valid-token",
        async () => ({
          email: "Admin@Example.com",
          email_verified: true,
          name: "Admin User",
        }),
        allowlist,
      ),
    ).toEqual({
      ok: true,
      email: "admin@example.com",
      name: "Admin User",
    });
  });

  it("rejects an authenticated user outside the allowlist", async () => {
    expect(
      await authorizeAdminToken(
        "Bearer valid-token",
        async () => ({ email: "user@example.com", email_verified: true }),
        allowlist,
      ),
    ).toEqual({ ok: false, status: 403 });
  });

  it("rejects an unverified email", async () => {
    expect(
      await authorizeAdminToken(
        "Bearer valid-token",
        async () => ({ email: "admin@example.com", email_verified: false }),
        allowlist,
      ),
    ).toEqual({ ok: false, status: 403 });
  });

  it("rejects Firebase token verification failures", async () => {
    expect(
      await authorizeAdminToken(
        "Bearer invalid-token",
        async () => {
          throw new Error("invalid token");
        },
        allowlist,
      ),
    ).toEqual({ ok: false, status: 401 });
  });
});
