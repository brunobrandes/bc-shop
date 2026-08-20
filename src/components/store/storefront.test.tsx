import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { Storefront } from "./storefront";

describe("localized storefront", () => {
  it("renders /en content in English", () => {
    const html = renderToStaticMarkup(
      <Storefront locale="en" currency="USD" />,
    );
    expect(html).toContain("The right computer for what you need.");
    expect(html).toContain("View computers");
    expect(html).not.toContain("Ver computadores");
  });

  it("renders /pt content in Portuguese", () => {
    const html = renderToStaticMarkup(
      <Storefront locale="pt" currency="BRL" />,
    );
    expect(html).toContain("O computador certo para o que você precisa.");
    expect(html).toContain("Ver computadores");
    expect(html).not.toContain("View computers");
  });
});
