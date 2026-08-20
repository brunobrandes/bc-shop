import { ContactForm } from "./contact-form";
import { Header } from "@/components/store/header";
import type { SupportedCurrency } from "@/lib/currency/currency";

export function ContactPageContent({
  currency,
}: {
  currency: SupportedCurrency;
}) {
  return (
    <div>
      <Header currency={currency} />
      <main className="contact-page">
        <div className="shell contact-layout">
          <section className="contact-intro">
            <span className="eyebrow">BC-SHOP SUPPORT</span>
            <h1>Talk to a computer specialist.</h1>
            <p>
              Request a call now or choose a convenient time to discuss
              products, configurations, or a quote.
            </p>
          </section>
          <section className="contact-card" aria-labelledby="schedule-title">
            <div className="contact-card__heading">
              <span className="eyebrow">REQUEST A CALL</span>
              <h2 id="schedule-title">How can we call you?</h2>
              <p>All fields are required except the message.</p>
            </div>
            <ContactForm currency={currency} />
          </section>
        </div>
      </main>
    </div>
  );
}
