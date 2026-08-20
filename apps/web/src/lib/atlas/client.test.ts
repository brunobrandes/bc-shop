import { describe, expect, it, vi } from "vitest";
import { AtlasClient } from "./client";

const config = {
  apiKey: "secret-test-key",
  baseUrl: "https://api.youratlas.com/v1/api",
};

describe("Atlas client", () => {
  it("maps scheduled calls to the documented Atlas endpoint", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('{"sequenceNumber":42}', { status: 200 }),
      );
    const client = new AtlasClient({ config, fetch: fetcher });
    const payload = {
      campaignId: "campaign-1",
      customerPhoneNumber: "+5511999998888",
      customerName: "Maria",
      customerInfo: "Source: BC-Shop website",
      scheduledDate: "2026-08-21T13:00:00.000Z",
    };

    await expect(client.scheduleCall(payload)).resolves.toEqual({
      sequenceNumber: 42,
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.youratlas.com/v1/api/campaign/createSchedule",
      expect.objectContaining({ body: JSON.stringify(payload) }),
    );
  });

  it("builds the chat URL and authenticates the JSON request", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    const client = new AtlasClient({ config, fetch: fetcher });
    await client.initiateWebChat({
      campaignId: "campaign/a",
      message: "Olá",
      contactIdentifier: "visitor-1",
    });
    expect(fetcher).toHaveBeenCalledWith(
      "https://api.youratlas.com/v1/api/campaign-chat/campaign%2Fa",
      expect.objectContaining({
        method: "POST",
        headers: {
          "api-key": "secret-test-key",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          message: "Olá",
          contactIdentifier: "visitor-1",
        }),
      }),
    );
  });

  it("normalizes upstream errors without exposing their body", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response('{"message":"sensitive"}', { status: 401 }),
      );
    const client = new AtlasClient({ config, fetch: fetcher });
    const request = client.initiateWebChat({
      campaignId: "campaign",
      message: "Hi",
      contactIdentifier: "visitor",
    });
    await expect(request).rejects.toMatchObject({
      code: "UPSTREAM",
      status: 401,
      message: "Atlas request failed",
    });
  });

  it("normalizes network errors", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("connection refused"));
    const client = new AtlasClient({ config, fetch: fetcher });
    await expect(
      client.initiateWebChat({
        campaignId: "campaign",
        message: "Hi",
        contactIdentifier: "visitor",
      }),
    ).rejects.toMatchObject({ code: "NETWORK" });
  });
});
