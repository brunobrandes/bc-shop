import { describe, expect, it } from "vitest";
import { findProductById, listProducts, searchProducts } from "./catalog";

describe("product catalog", () => {
  it("returns the canonical catalog", () =>
    expect(listProducts()).toHaveLength(6));
  it("retrieves an existing product", () =>
    expect(findProductById("bc-gamer-x")?.name).toBe("BC Gamer X"));
  it("returns undefined for an unknown product", () =>
    expect(findProductById("missing")).toBeUndefined());

  it("searches the canonical product objects", () => {
    const result = searchProducts({ query: "RTX 4070" });
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(findProductById("bc-creator-pro"));
  });

  it("filters by category and canonical BRL price", () => {
    expect(searchProducts({ category: "work" }).map((item) => item.id)).toEqual(
      ["bc-office-pro", "bc-business-mini"],
    );
    expect(searchProducts({ maxPrice: 3000 }).map((item) => item.id)).toEqual([
      "bc-home-14",
    ]);
  });
});
