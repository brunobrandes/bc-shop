import type { Locale } from "@/lib/i18n/locale";

export const supportedCurrencies = ["BRL", "USD", "EUR", "GBP"] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];
export type Money = { amount: number; currency: "BRL" };
export const currencyCookieName = "bc_currency";

// Display-only conversion rates. BRL remains the sole canonical price book.
const brlDisplayRates: Record<SupportedCurrency, number> = {
  BRL: 1,
  USD: 0.2,
  EUR: 0.18,
  GBP: 0.15,
};

export function isSupportedCurrency(
  value: unknown,
): value is SupportedCurrency {
  return supportedCurrencies.includes(value as SupportedCurrency);
}

export function resolveCurrency(
  saved: string | undefined,
  locale: Locale,
): SupportedCurrency {
  if (isSupportedCurrency(saved)) return saved;
  return locale === "pt" ? "BRL" : "USD";
}

export function convertFromBrl(
  money: Money,
  currency: SupportedCurrency,
): number {
  return money.amount * brlDisplayRates[currency];
}

export function formatMoney(
  money: Money,
  currency: SupportedCurrency,
  locale: Locale,
): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(convertFromBrl(money, currency));
}
