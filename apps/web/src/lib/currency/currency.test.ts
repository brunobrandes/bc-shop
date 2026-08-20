import { describe, expect, it } from "vitest";
import { formatMoney, resolveCurrency } from "./currency";

describe("storefront currency", () => {
  it("defaults to USD", () => {
    expect(resolveCurrency(undefined)).toBe("USD");
  });
  it("keeps a saved supported currency", () => {
    expect(resolveCurrency("EUR")).toBe("EUR");
  });
  it("formats canonical BRL prices", () => {
    expect(formatMoney({ amount: 5999.9, currency: "BRL" }, "BRL")).toBe(
      "R$5,999.90",
    );
  });
  it("converts and formats USD, EUR, and GBP display prices", () => {
    const price = { amount: 5000, currency: "BRL" } as const;
    expect(formatMoney(price, "USD")).toBe("$1,000.00");
    expect(formatMoney(price, "EUR")).toBe("€900.00");
    expect(formatMoney(price, "GBP")).toBe("£750.00");
  });
});
