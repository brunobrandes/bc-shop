import { describe, expect, it } from "vitest";
import {
  buildCustomerInfo,
  normalizeBrazilianPhone,
  validateScheduleCall,
  zonedDateTimeToIso,
} from "./schedule-call";

const validInput = {
  name: "Maria Silva",
  phone: "(11) 99999-8888",
  reason: "Ajuda para escolher um computador",
  message: "Preciso usar AutoCAD.",
  mode: "scheduled",
  scheduledDate: "2026-08-21",
  scheduledTime: "10:00",
  timezone: "America/Sao_Paulo",
  locale: "pt",
  currency: "BRL",
  consent: true,
};

describe("call scheduling validation", () => {
  it.each([
    ["(11) 99999-8888", "+5511999998888"],
    ["+55 11 3333-2222", "+551133332222"],
    ["005511999998888", "+5511999998888"],
  ])("normalizes %s", (input, expected) =>
    expect(normalizeBrazilianPhone(input)).toBe(expected),
  );

  it("rejects invalid Brazilian phone numbers", () =>
    expect(normalizeBrazilianPhone("1234")).toBeUndefined());

  it("maps São Paulo wall-clock time to an ISO instant", () => {
    const result = validateScheduleCall(
      validInput,
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: {
        phone: "+5511999998888",
        scheduledDate: "2026-08-21T13:00:00.000Z",
      },
    });
  });

  it("accepts the English contact flow reasons", () => {
    const result = validateScheduleCall(
      { ...validInput, reason: "Help choosing a computer" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: { reason: "Help choosing a computer" },
    });
  });

  it("does not require date or time for immediate mode", () => {
    const { scheduledDate, scheduledTime, ...input } = validInput;
    void scheduledDate;
    void scheduledTime;
    const result = validateScheduleCall(
      { ...input, mode: "now" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: { mode: "now" },
    });
    if (result.success) expect(result.data.scheduledDate).toBeUndefined();
  });

  it("requires a future date and time for scheduled mode", () => {
    const result = validateScheduleCall(
      { ...validInput, scheduledDate: undefined, scheduledTime: undefined },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
    if (!result.success) expect(result.message).toContain("futuros");
  });

  it("rejects an unsupported timezone", () => {
    const result = validateScheduleCall(
      { ...validInput, timezone: "Asia/Tokyo" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
  });

  it("converts another supported timezone to UTC", () => {
    const result = validateScheduleCall(
      { ...validInput, timezone: "America/New_York" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({
      success: true,
      data: { scheduledDate: "2026-08-21T14:00:00.000Z" },
    });
  });

  it("uses the New York DST offset for the selected date", () => {
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

  it.each([
    [{ ...validInput, name: "" }, "nome"],
    [{ ...validInput, reason: "Invalid" }, "motivo"],
    [{ ...validInput, consent: false }, "consentimento"],
    [{ ...validInput, scheduledDate: "2026-08-19" }, "futuros"],
  ])("rejects invalid input", (input, error) => {
    const result = validateScheduleCall(
      input,
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
    if (!result.success) expect(result.message).toContain(error);
  });

  it("builds concise Atlas customer context", () =>
    expect(
      buildCustomerInfo("Orçamento", "Quero cinco computadores.", "pt", "BRL"),
    ).toBe(
      "Source: BC-Shop website\nLanguage: pt\nCurrency: BRL\nReason: Orçamento\nCustomer message: Quero cinco computadores.",
    ));

  it("rejects an invalid currency", () => {
    const result = validateScheduleCall(
      { ...validInput, currency: "CAD" },
      new Date("2026-08-20T12:00:00Z"),
    );
    expect(result).toMatchObject({ success: false });
  });
});
