"use client";

import { useRouter } from "next/navigation";
import {
  currencyCookieName,
  supportedCurrencies,
  type SupportedCurrency,
} from "@/lib/currency/currency";

export function CurrencySelector({
  currency,
}: {
  currency: SupportedCurrency;
}) {
  const router = useRouter();
  return (
    <label className="currency-selector">
      <span className="sr-only">Currency</span>
      <select
        aria-label="Currency"
        value={currency}
        onChange={(event) => {
          document.cookie = `${currencyCookieName}=${event.target.value}; Path=/; Max-Age=31536000; SameSite=Lax`;
          router.refresh();
        }}
      >
        {supportedCurrencies.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
    </label>
  );
}
