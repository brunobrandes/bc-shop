import { describe, expect, it } from "vitest";
import { normalizePhone } from "./countries";
import {
  buildCustomerInfo,
  validateScheduleCall,
  zonedDateTimeToIso,
} from "./schedule-call";

const validInput = {
  name: "Maria Silva",
  country: "US",
  phone: "(415) 555-2671",
  reason: "Help choosing a computer",
  message: "I need to use AutoCAD.",
  mode: "scheduled",
  scheduledDate: "2026-08-21",
  scheduledTime: "10:00",
  timezone: "America/Sao_Paulo",
  currency: "USD",
  consent: true,
};

describe("call scheduling validation", () => {
  it.each([
    ["US", "(415) 555-2671", "+14155552671"],
    ["US", "+1 212 555 0198", "+12125550198"],
  ] as const)("normalizes a %s phone", (country, input, expected) => {
    expect(normalizePhone(input, country)).toBe(expected);
  });

  it("requires a country", () => {
    const result = validateScheduleCall(
      { ...validInput, country: undefined },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toEqual({
      success: false,
      message: "Select a valid country.",
    });
  });

  it("accepts United States phone numbers", () => {
    const result = validateScheduleCall(
      validInput,
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result.success).toBe(true);
  });

  it.each(["CA", "BR", "GB", "PT", "ES"])(
    "rejects unsupported country %s",
    (country) => {
      const result = validateScheduleCall(
        { ...validInput, country },
        new Date("2026-08-20T12:00:00Z"),
      );
      expect(result).toMatchObject({ success: false });
    },
  );

  it("maps São Paulo wall-clock time to an ISO instant", () => {
    const result = validateScheduleCall(
      validInput,
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        phone: "+14155552671",
        scheduledDate: "2026-08-21T13:00:00.000Z",
      },
    });
  });

  it("does not require scheduling fields for immediate mode", () => {
    const result = validateScheduleCall(
      {
        ...validInput,
        mode: "now",
        scheduledDate: undefined,
        scheduledTime: undefined,
        timezone: undefined,
      },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: true, data: { mode: "now" } });
    if (result.success) expect(result.data.scheduledDate).toBeUndefined();
  });

  it("requires a future date and time for scheduled mode", () => {
    const result = validateScheduleCall(
      { ...validInput, scheduledDate: undefined, scheduledTime: undefined },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toEqual({
      success: false,
      message: "Choose a future date and time.",
    });
  });

  it("rejects an unsupported timezone", () => {
    const result = validateScheduleCall(
      { ...validInput, timezone: "Asia/Tokyo" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
  });

  it("converts New York wall-clock time to UTC", () => {
    const result = validateScheduleCall(
      { ...validInput, timezone: "America/New_York" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: { scheduledDate: "2026-08-21T14:00:00.000Z" },
    });
  });

  it("uses the selected date's DST offset", () => {
    expect(zonedDateTimeToIso("2026-01-21", "10:00", "America/New_York")).toBe(
      "2026-01-21T15:00:00.000Z",
    );
    expect(zonedDateTimeToIso("2026-08-21", "10:00", "America/New_York")).toBe(
      "2026-08-21T14:00:00.000Z",
    );
  });

  it("rejects a nonexistent local time during the DST jump", () => {
    expect(
      zonedDateTimeToIso("2026-03-08", "02:30", "America/New_York"),
    ).toBeUndefined();
  });

  it("builds Atlas context with country and without language", () => {
    const context = buildCustomerInfo(
      "US",
      "USD",
      "Quote request",
      "I need five computers.",
    );
    expect(context).toBe(
      "Source: BC-Shop website\nCountry: US\nCurrency: USD\nReason: Quote request\nCustomer message: I need five computers.",
    );
    expect(context).not.toContain("Language");
  });

  it("rejects an invalid currency", () => {
    const result = validateScheduleCall(
      { ...validInput, currency: "CAD" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
  });
});
