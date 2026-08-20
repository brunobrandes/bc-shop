import { describe, expect, it } from "vitest";
import { formatMoney, resolveCurrency } from "./currency";

describe("storefront currency", () => {
  it("defaults Portuguese to BRL and English to USD", () => {
    expect(resolveCurrency(undefined, "pt")).toBe("BRL");
    expect(resolveCurrency(undefined, "en")).toBe("USD");
  });
  it("keeps a saved currency regardless of locale", () => {
    expect(resolveCurrency("EUR", "en")).toBe("EUR");
    expect(resolveCurrency("EUR", "pt")).toBe("EUR");
  });
  it("formats canonical BRL prices", () => {
    expect(formatMoney({ amount: 5999.9, currency: "BRL" }, "BRL", "pt")).toBe(
      "R$ 5.999,90",
    );
  });
  it("converts and formats USD, EUR, and GBP display prices", () => {
    const price = { amount: 5000, currency: "BRL" } as const;
    expect(formatMoney(price, "USD", "en")).toBe("$1,000.00");
    expect(formatMoney(price, "EUR", "en")).toBe("€900.00");
    expect(formatMoney(price, "GBP", "en")).toBe("£750.00");
  });
});
