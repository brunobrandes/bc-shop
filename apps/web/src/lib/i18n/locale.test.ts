import { describe, expect, it } from "vitest";
import { resolveLocale, switchLocalePath } from "./locale";

describe("locale routing", () => {
  it("respects a persisted locale before browser language", () => {
    expect(resolveLocale("en", "pt-BR")).toBe("en");
  });
  it("infers Portuguese and falls back to English for other browser languages", () => {
    expect(resolveLocale(undefined, "pt-BR,pt;q=0.9")).toBe("pt");
    expect(resolveLocale(undefined, "en-US,en;q=0.9")).toBe("en");
    expect(resolveLocale()).toBe("pt");
  });
  it("preserves equivalent localized routes", () => {
    expect(switchLocalePath("/pt/contact", "en")).toBe("/en/contact");
    expect(switchLocalePath("/en", "pt")).toBe("/pt");
  });
});
