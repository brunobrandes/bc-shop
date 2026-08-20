import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { ContactPageContent } from "@/components/contact/contact-page";
import { Storefront } from "./storefront";

describe("English storefront routes", () => {
  it("renders the root storefront in English", () => {
    const html = renderToStaticMarkup(<Storefront currency="USD" />);
    expect(html).toContain("The right computer for what you need.");
    expect(html).toContain("View computers");
    expect(html).not.toContain("Ver computadores");
  });

  it("renders the contact page in English", () => {
    const html = renderToStaticMarkup(<ContactPageContent currency="USD" />);
    expect(html).toContain("Talk to a computer specialist.");
    expect(html).toContain("Call me now");
    expect(html).not.toContain("Agendar");
  });
});
