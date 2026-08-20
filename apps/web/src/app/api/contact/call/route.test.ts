import { beforeEach, describe, expect, it, vi } from "vitest";

const { scheduleCall } = vi.hoisted(() => ({ scheduleCall: vi.fn() }));
vi.mock("@/lib/atlas/client", () => ({ atlas: { scheduleCall } }));
vi.mock("@/lib/atlas/config", () => ({
  getAtlasCampaignId: () => "campaign-1",
}));

import { POST } from "./route";

const baseBody = {
  name: "Maria Silva",
  phone: "(11) 99999-8888",
  reason: "Orçamento",
  message: "Preciso de cinco computadores.",
  consent: true,
  locale: "pt",
  currency: "BRL",
};

function request(payload: unknown) {
  return new Request("http://localhost/api/contact/call", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/contact/call", () => {
  beforeEach(() => {
    scheduleCall.mockReset();
    scheduleCall.mockResolvedValue({ sequenceNumber: 42 });
  });

  it("omits scheduledDate from an immediate Atlas call", async () => {
    const response = await POST(request({ ...baseBody, mode: "now" }));

    expect(response.status).toBe(200);
    expect(scheduleCall).toHaveBeenCalledWith({
      campaignId: "campaign-1",
      customerPhoneNumber: "+5511999998888",
      customerName: "Maria Silva",
      customerInfo:
        "Source: BC-Shop website\nLanguage: pt\nCurrency: BRL\nReason: Orçamento\nCustomer message: Preciso de cinco computadores.",
    });
    expect(scheduleCall.mock.calls[0][0]).not.toHaveProperty("scheduledDate");
  });

  it("sends scheduledDate for a scheduled Atlas call", async () => {
    const response = await POST(
      request({
        ...baseBody,
        mode: "scheduled",
        scheduledDate: "2099-08-21",
        scheduledTime: "10:00",
        timezone: "America/Sao_Paulo",
      }),
    );

    expect(response.status).toBe(200);
    expect(scheduleCall).toHaveBeenCalledWith(
      expect.objectContaining({ scheduledDate: "2099-08-21T13:00:00.000Z" }),
    );
    const atlasPayload = scheduleCall.mock.calls[0][0];
    expect(atlasPayload.scheduledDate).toMatch(/Z$/);
    expect(atlasPayload).not.toHaveProperty("timezone");
    expect(atlasPayload).not.toHaveProperty("campaignTimezone");
    await expect(response.json()).resolves.toEqual({
      data: { accepted: true, sequenceNumber: 42 },
    });
  });

  it("rejects scheduled mode without future date and time", async () => {
    const response = await POST(request({ ...baseBody, mode: "scheduled" }));
    expect(response.status).toBe(400);
    expect(scheduleCall).not.toHaveBeenCalled();
  });

  it("accepts immediate mode without date and time", async () => {
    const response = await POST(request({ ...baseBody, mode: "now" }));
    expect(response.status).toBe(200);
    expect(scheduleCall).toHaveBeenCalledOnce();
  });
});
