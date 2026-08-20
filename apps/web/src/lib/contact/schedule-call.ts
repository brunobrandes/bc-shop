import { isLocale, type Locale } from "@/lib/i18n/locale";
import {
  isSupportedCurrency,
  type SupportedCurrency,
} from "@/lib/currency/currency";

export const contactReasons = [
  "Dúvida sobre produto",
  "Ajuda para escolher um computador",
  "Orçamento",
  "Dúvida comercial",
  "Outro",
] as const;

export const englishContactReasons = [
  "Product question",
  "Help choosing a computer",
  "Quote request",
  "Sales question",
  "Other",
] as const;

export type ContactReason = (typeof contactReasons)[number];
export type EnglishContactReason = (typeof englishContactReasons)[number];
export type SupportedContactReason = ContactReason | EnglishContactReason;
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
  phone?: unknown;
  reason?: unknown;
  message?: unknown;
  mode?: unknown;
  scheduledDate?: unknown;
  scheduledTime?: unknown;
  consent?: unknown;
  timezone?: unknown;
  locale?: unknown;
  currency?: unknown;
};

export type ValidatedScheduleCall = {
  name: string;
  phone: string;
  reason: SupportedContactReason;
  message: string;
  mode: "now" | "scheduled";
  scheduledDate?: string;
  timezone?: SupportedTimezone;
  locale: Locale;
  currency: SupportedCurrency;
};

export type ValidationResult =
  | { success: true; data: ValidatedScheduleCall }
  | { success: false; message: string };

export function normalizeBrazilianPhone(value: string): string | undefined {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("55")) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return undefined;
  const areaCode = Number(digits.slice(0, 2));
  const subscriber = digits.slice(2);
  if (areaCode < 11 || areaCode > 99) return undefined;
  if (
    (subscriber.length === 9 && subscriber[0] !== "9") ||
    (subscriber.length === 8 && !/[2-5]/.test(subscriber[0]))
  )
    return undefined;
  return `+55${digits}`;
}

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
  if (!isLocale(input.locale))
    return { success: false, message: "Selecione um idioma válido." };
  const errors =
    input.locale === "en"
      ? {
          name: "Enter a valid name.",
          phone: "Enter a valid Brazilian phone number.",
          reason: "Select a valid contact reason.",
          message: "The message must be 1,000 characters or less.",
          mode: "Select a valid call option.",
          timezone: "Select a valid time zone.",
          future: "Choose a future date and time.",
          consent: "Confirm your consent to receive the call.",
        }
      : {
          name: "Informe um nome válido.",
          phone: "Informe um telefone brasileiro válido.",
          reason: "Selecione um motivo válido.",
          message: "A mensagem deve ter até 1000 caracteres.",
          mode: "Selecione uma opção de contato válida.",
          timezone: "Selecione um fuso horário válido.",
          future: "Escolha uma data e horário futuros.",
          consent: "Confirme o consentimento para receber a ligação.",
        };
  if (!isSupportedCurrency(input.currency))
    return {
      success: false,
      message:
        input.locale === "en"
          ? "Select a valid currency."
          : "Selecione uma moeda válida.",
    };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 100)
    return { success: false, message: errors.name };

  const phone =
    typeof input.phone === "string"
      ? normalizeBrazilianPhone(input.phone)
      : undefined;
  if (!phone)
    return {
      success: false,
      message: errors.phone,
    };

  if (
    typeof input.reason !== "string" ||
    ![...contactReasons, ...englishContactReasons].includes(
      input.reason as ContactReason,
    )
  )
    return { success: false, message: errors.reason };

  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (message.length > 1000)
    return {
      success: false,
      message: errors.message,
    };

  if (input.mode !== "now" && input.mode !== "scheduled")
    return {
      success: false,
      message: errors.mode,
    };

  let scheduledDate: string | undefined;
  let timezone: SupportedTimezone | undefined;
  if (input.mode === "scheduled") {
    if (
      typeof input.timezone !== "string" ||
      !supportedTimezones.includes(input.timezone as SupportedTimezone)
    )
      return { success: false, message: errors.timezone };
    timezone = input.timezone as SupportedTimezone;
    scheduledDate =
      typeof input.scheduledDate === "string" &&
      typeof input.scheduledTime === "string"
        ? zonedDateTimeToIso(input.scheduledDate, input.scheduledTime, timezone)
        : undefined;
    if (!scheduledDate || new Date(scheduledDate) <= now)
      return { success: false, message: errors.future };
  }

  if (input.consent !== true)
    return {
      success: false,
      message: errors.consent,
    };

  return {
    success: true,
    data: {
      name,
      phone,
      reason: input.reason as SupportedContactReason,
      message,
      mode: input.mode,
      locale: input.locale,
      currency: input.currency,
      ...(scheduledDate ? { scheduledDate } : {}),
      ...(timezone ? { timezone } : {}),
    },
  };
}

export function buildCustomerInfo(
  reason: SupportedContactReason,
  message: string,
  locale: Locale,
  currency: SupportedCurrency,
) {
  return [
    "Source: BC-Shop website",
    `Language: ${locale}`,
    `Currency: ${currency}`,
    `Reason: ${reason}`,
    message ? `Customer message: ${message}` : undefined,
  ]
    .filter(Boolean)
    .join("\n");
}
