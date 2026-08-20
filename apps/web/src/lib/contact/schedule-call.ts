import {
  isSupportedCountry,
  normalizePhone,
  type SupportedCountry,
} from "@/lib/contact/countries";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency/currency";

export const contactReasons = [
  "Product question",
  "Help choosing a computer",
  "Quote request",
  "Sales question",
  "Other",
] as const;

export type ContactReason = (typeof contactReasons)[number];
export const supportedTimezones = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Madrid",
] as const;
export type SupportedTimezone = (typeof supportedTimezones)[number];

export type ScheduleCallRequest = {
  name?: unknown;
  country?: unknown;
  phone?: unknown;
  reason?: unknown;
  message?: unknown;
  mode?: unknown;
  scheduledDate?: unknown;
  scheduledTime?: unknown;
  consent?: unknown;
  timezone?: unknown;
  currency?: unknown;
};

export type ValidatedScheduleCall = {
  name: string;
  country: SupportedCountry;
  phone: string;
  reason: ContactReason;
  message: string;
  mode: "now" | "scheduled";
  scheduledDate?: string;
  timezone?: SupportedTimezone;
  currency: SupportedCurrency;
};

export type ValidationResult =
  | { success: true; data: ValidatedScheduleCall }
  | { success: false; message: string };

function getTimeZoneOffset(
  instant: Date,
  timeZone: string,
): number | undefined {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(instant)
    .find((part) => part.type === "timeZoneName")?.value;
  if (name === "GMT") return 0;
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(name ?? "");
  if (!match) return undefined;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return (match[1] === "+" ? 1 : -1) * minutes * 60_000;
}

export function zonedDateTimeToIso(
  date: string,
  time: string,
  timeZone: SupportedTimezone,
): string | undefined {
  // The selected timezone interprets the customer's wall clock. This returns
  // the absolute UTC instant; Atlas campaign timezone remains Atlas-owned config.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) return undefined;

  const [, year, month, day] = match.map(Number);
  const [, hour, minute] = timeMatch.map(Number);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  )
    return undefined;

  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  let instant = new Date(wallClockUtc);
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const offset = getTimeZoneOffset(instant, timeZone);
    if (offset === undefined) return undefined;
    instant = new Date(wallClockUtc - offset);
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  if (
    part("year") !== year.toString().padStart(4, "0") ||
    part("month") !== month.toString().padStart(2, "0") ||
    part("day") !== day.toString().padStart(2, "0") ||
    part("hour") !== hour.toString().padStart(2, "0") ||
    part("minute") !== minute.toString().padStart(2, "0")
  )
    return undefined;

  return instant.toISOString();
}

export function validateScheduleCall(
  input: ScheduleCallRequest,
  now = new Date(),
): ValidationResult {
  if (!isSupportedCurrency(input.currency))
    return { success: false, message: "Select a valid currency." };

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 100)
    return { success: false, message: "Enter a valid name." };

  if (!isSupportedCountry(input.country))
    return { success: false, message: "Select a valid country." };

  const phone =
    typeof input.phone === "string"
      ? normalizePhone(input.phone, input.country)
      : undefined;
  if (!phone) return { success: false, message: "Enter a valid phone number." };

  if (
    typeof input.reason !== "string" ||
    !contactReasons.includes(input.reason as ContactReason)
  )
    return { success: false, message: "Select a valid contact reason." };

  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (message.length > 1000)
    return {
      success: false,
      message: "The message must be 1,000 characters or less.",
    };

  if (input.mode !== "now" && input.mode !== "scheduled")
    return { success: false, message: "Select a valid call option." };

  let scheduledDate: string | undefined;
  let timezone: SupportedTimezone | undefined;
  if (input.mode === "scheduled") {
    if (
      typeof input.timezone !== "string" ||
      !supportedTimezones.includes(input.timezone as SupportedTimezone)
    )
      return { success: false, message: "Select a valid time zone." };
    timezone = input.timezone as SupportedTimezone;
    scheduledDate =
      typeof input.scheduledDate === "string" &&
      typeof input.scheduledTime === "string"
        ? zonedDateTimeToIso(input.scheduledDate, input.scheduledTime, timezone)
        : undefined;
    if (!scheduledDate || new Date(scheduledDate) <= now)
      return { success: false, message: "Choose a future date and time." };
  }

  if (input.consent !== true)
    return {
      success: false,
      message: "Confirm your consent to receive the call.",
    };

  return {
    success: true,
    data: {
      name,
      country: input.country,
      phone,
      reason: input.reason as ContactReason,
      message,
      mode: input.mode,
      currency: input.currency,
      ...(scheduledDate ? { scheduledDate } : {}),
      ...(timezone ? { timezone } : {}),
    },
  };
}

export function buildCustomerInfo(
  country: SupportedCountry,
  currency: SupportedCurrency,
  reason: ContactReason,
  message: string,
) {
  return [
    "Source: BC-Shop website",
    `Country: ${country}`,
    `Currency: ${currency}`,
    `Reason: ${reason}`,
    message ? `Customer message: ${message}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
