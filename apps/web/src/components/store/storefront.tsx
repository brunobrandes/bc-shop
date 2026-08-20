import { Header } from "./header";
import { ProductCard } from "./product-card";
import { SalesAssistantTrigger } from "./sales-assistant-trigger";
import { listProducts } from "@/lib/products/catalog";
import type { SupportedCurrency } from "@/lib/currency/currency";

const copy = {
  heroEyebrow: "TECHNOLOGY THAT MAKES SENSE",
  title: "The right computer for what you need.",
  intro:
    "Compare computers for home, work, or gaming. If you prefer, our team can help you choose with confidence.",
  chips: [
    ["Ready for work", "Performance without excess"],
    ["A smarter choice", "Built for your routine"],
  ],
  benefits: [
    ["Clear configurations", "Understand exactly what you are buying"],
    ["For every profile", "From everyday use to professional work"],
    ["Specialist support", "Guidance to choose with confidence"],
  ],
  categories: [
    ["Home", "Study and everyday tasks"],
    ["Work", "Reliable productivity"],
    ["Gaming", "Performance to get in the game"],
    ["Workstation", "Power for demanding creative work"],
  ],
} as const;

export function Storefront({ currency }: { currency: SupportedCurrency }) {
  const products = listProducts();
  return (
    <div>
      <Header currency={currency} />
      <main>
        <section className="hero">
          <div className="shell hero__grid">
            <div className="hero__content">
              <span className="eyebrow">{copy.heroEyebrow}</span>
              <h1>{copy.title}</h1>
              <p>{copy.intro}</p>
              <div className="hero__actions">
                <a className="button button--accent" href="#computers">
                  View computers
                </a>
                <SalesAssistantTrigger variant="light" />
              </div>
            </div>
            <div className="hero__visual" aria-hidden="true">
              <div className="hero__glow" />
              <div className="hero-laptop">
                <div className="hero-laptop__screen">
                  <div className="screen-mark">
                    BC<span>SHOP</span>
                  </div>
                  <div className="screen-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
                <div className="hero-laptop__deck" />
              </div>
              <div className="hero-chip hero-chip--top">
                <b>{copy.chips[0][0]}</b>
                <span>{copy.chips[0][1]}</span>
              </div>
              <div className="hero-chip hero-chip--bottom">
                <b>{copy.chips[1][0]}</b>
                <span>{copy.chips[1][1]}</span>
              </div>
            </div>
          </div>
        </section>
        <section className="benefits" aria-label="Benefits">
          <div className="shell benefits__grid">
            {copy.benefits.map(([title, detail]) => (
              <div key={title}>
                <b>{title}</b>
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="catalog shell" id="computers">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR SELECTION</span>
              <h2>Find your next computer</h2>
            </div>
            <p>
              Balanced computers for different routines, with straightforward
              specifications and no surprises.
            </p>
          </div>
          <div className="catalog__grid">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={currency}
              />
            ))}
          </div>
        </section>
        <section className="categories" id="categories">
          <div className="shell">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SHOP BY PROFILE</span>
                <h2>Made for your pace</h2>
              </div>
            </div>
            <div className="categories__grid">
              {copy.categories.map(([title, detail], index) => (
                <a href="#computers" key={title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <b>{title}</b>
                  <small>{detail}</small>
                </a>
              ))}
            </div>
          </div>
        </section>
        <section className="specialist shell" id="support">
          <div>
            <span className="eyebrow">STILL NOT SURE?</span>
            <h2>Let’s find the right configuration together.</h2>
            <p>
              Tell us how you plan to use your computer and receive direct
              guidance.
            </p>
          </div>
          <SalesAssistantTrigger variant="light" />
        </section>
      </main>
      <footer>
        <div className="shell footer__inner">
          <div>
            <div className="brand brand--footer">
              <span>BC</span> Shop
            </div>
            <p>Computers for every way of working.</p>
          </div>
          <div>
            <b>Products</b>
            <a href="#computers">Computers</a>
            <a href="#categories">Categories</a>
          </div>
          <div>
            <b>Support</b>
            <a href="/contact">Talk to a specialist</a>
            <span>Mon–Fri, 9am–6pm</span>
          </div>
        </div>
        <div className="shell footer__bottom">
          © {new Date().getFullYear()} BC-Shop. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
